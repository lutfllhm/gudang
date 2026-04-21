const cron = require('node-cron');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const QueueService = require('./QueueService');
const ItemService = require('./ItemService');
const SalesOrderService = require('./SalesOrderService');
const CustomerService = require('./CustomerService');

class SyncService {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
  }

  /**
   * Start auto sync
   */
  async startAutoSync() {
    try {
      const config = await this.getSyncConfig();
      
      if (!config.auto_sync_enabled) {
        logger.info('Auto sync is disabled');
        return;
      }

      // Stop existing cron if running
      if (this.cronJob) {
        this.cronJob.stop();
      }

      // Calculate cron expression from interval
      const intervalMinutes = Math.floor(config.sync_interval_seconds / 60);
      const cronExpression = `*/${intervalMinutes} * * * *`;

      logger.info('Starting auto sync', { 
        interval: config.sync_interval_seconds,
        cronExpression 
      });

      // Create cron job
      this.cronJob = cron.schedule(cronExpression, async () => {
        if (this.isRunning) {
          logger.warn('Sync already running, skipping this cycle');
          return;
        }

        try {
          this.isRunning = true;
          await this.performSync();
        } catch (error) {
          logger.error('Auto sync error:', error);
        } finally {
          this.isRunning = false;
        }
      });

      logger.info('Auto sync started successfully');
    } catch (error) {
      logger.error('Failed to start auto sync:', error);
    }
  }

  /**
   * Stop auto sync
   */
  stopAutoSync() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Auto sync stopped');
    }
  }

  /**
   * Perform sync
   */
  async performSync(userId = null) {
    const startTime = Date.now();
    
    try {
      logger.info('Starting sync process');

      // Get user with active token if not provided
      if (!userId) {
        const userResult = await query(
          'SELECT user_id FROM accurate_tokens WHERE is_active = 1 AND expires_at > NOW() ORDER BY id DESC LIMIT 1'
        );
        
        if (userResult.length === 0) {
          throw new Error('No active token found');
        }
        
        userId = userResult[0].user_id;
        logger.info('Using user for sync', { userId });
      }

      // Update sync status
      await query(
        'UPDATE sync_config SET last_sync_status = ?, last_sync_error = NULL WHERE id = 1',
        ['running']
      );

      // Create sync log
      const logResult = await query(
        'INSERT INTO sync_logs (sync_type, status) VALUES (?, ?)',
        ['full', 'started']
      );
      const logId = logResult.insertId;

      let totalRecords = 0;

      // Sync items
      try {
        const itemsResult = await ItemService.syncFromAccurate(userId);
        totalRecords += itemsResult.synced || 0;
        
        await query(
          'UPDATE sync_config SET last_sync_items = NOW() WHERE id = 1'
        );
      } catch (error) {
        logger.error('Items sync failed:', error);
      }

      // Sync sales orders
      try {
        const ordersResult = await SalesOrderService.syncFromAccurate(userId);
        totalRecords += ordersResult.synced || 0;
        
        await query(
          'UPDATE sync_config SET last_sync_sales_orders = NOW() WHERE id = 1'
        );
      } catch (error) {
        logger.error('Sales orders sync failed:', error);
        throw error; // Re-throw to be caught by outer catch
      }

      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Update sync log
      await query(
        `UPDATE sync_logs 
         SET status = ?, records_synced = ?, completed_at = NOW(), duration_seconds = ?
         WHERE id = ?`,
        ['success', totalRecords, duration, logId]
      );

      // Update sync config
      await query(
        'UPDATE sync_config SET last_sync_status = ? WHERE id = 1',
        ['success']
      );

      logger.info('Sync completed successfully', { 
        totalRecords, 
        duration 
      });

      return { success: true, totalRecords, duration };
    } catch (error) {
      logger.error('Sync failed:', error);

      // Update sync config with error
      await query(
        'UPDATE sync_config SET last_sync_status = ?, last_sync_error = ? WHERE id = 1',
        ['failed', error.message]
      );

      throw error;
    }
  }

  /**
   * Get sync configuration
   */
  async getSyncConfig() {
    const results = await query('SELECT * FROM sync_config WHERE id = 1');
    
    if (results.length === 0) {
      // Create default config
      await query(
        `INSERT INTO sync_config (id, sync_start_date, auto_sync_enabled, sync_interval_seconds)
         VALUES (1, CURDATE(), TRUE, 300)`
      );
      return this.getSyncConfig();
    }

    return results[0];
  }

  /**
   * Update sync configuration
   */
  async updateSyncConfig(config) {
    await query(
      `UPDATE sync_config 
       SET auto_sync_enabled = ?, sync_interval_seconds = ?
       WHERE id = 1`,
      [config.auto_sync_enabled, config.sync_interval_seconds]
    );

    // Restart auto sync if enabled
    if (config.auto_sync_enabled) {
      await this.startAutoSync();
    } else {
      this.stopAutoSync();
    }

    logger.info('Sync config updated', config);

    return { success: true };
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const config = await this.getSyncConfig();
    
    const recentLogs = await query(
      `SELECT * FROM sync_logs 
       ORDER BY started_at DESC 
       LIMIT 10`
    );

    return {
      config: {
        autoSyncEnabled: config.auto_sync_enabled,
        syncIntervalSeconds: config.sync_interval_seconds,
        lastSyncItems: config.last_sync_items,
        lastSyncSalesOrders: config.last_sync_sales_orders,
        lastSyncStatus: config.last_sync_status,
        lastSyncError: config.last_sync_error
      },
      isRunning: this.isRunning,
      recentLogs
    };
  }

  /**
   * Manual sync trigger (selalu antre ke queue, tidak blokir dengan isRunning)
   */
  async triggerManualSync(userId, type = 'full') {
    logger.info('Manual sync triggered', { userId, type });

    // Add to queue for async processing (queue akan proses satu per satu)
    await QueueService.addSyncJob(type, userId);

    return { success: true, message: 'Sync job queued' };
  }
}

module.exports = new SyncService();
