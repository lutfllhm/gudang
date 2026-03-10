const SyncService = require('../services/SyncService');
const QueueService = require('../services/QueueService');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

class SyncController {
  /**
   * Get sync status
   */
  static getStatus = asyncHandler(async (req, res) => {
    const status = await SyncService.getSyncStatus();
    const queueStats = await QueueService.getAllQueueStats();

    success(res, {
      ...status,
      queueStats
    });
  });

  /**
   * Trigger manual sync
   */
  static triggerSync = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type = 'full' } = req.body;

    const result = await SyncService.triggerManualSync(userId, type);

    success(res, result, 'Sync triggered successfully');
  });

  /**
   * Sync items only
   */
  static syncItems = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await SyncService.triggerManualSync(userId, 'items');

    success(res, result, 'Items sync triggered successfully');
  });

  /**
   * Sync sales orders only
   */
  static syncSalesOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate, forceFullSync } = req.body;

    // If dates provided, sync directly with options
    if (startDate || endDate || forceFullSync !== undefined) {
      const SalesOrderService = require('../services/SalesOrderService');
      
      const result = await SalesOrderService.syncFromAccurate(userId, {
        startDate,
        endDate,
        forceFullSync: forceFullSync || false
      });

      success(res, result, 'Sales orders synced successfully');
    } else {
      // Use queue for default sync
      const result = await SyncService.triggerManualSync(userId, 'sales-orders');
      success(res, result, 'Sales orders sync triggered successfully');
    }
  });

  /**
   * Update sync configuration
   */
  static updateConfig = asyncHandler(async (req, res) => {
    const { auto_sync_enabled, sync_interval_seconds } = req.body;

    const result = await SyncService.updateSyncConfig({
      auto_sync_enabled,
      sync_interval_seconds
    });

    success(res, result, 'Sync configuration updated');
  });

  /**
   * Get queue statistics
   */
  static getQueueStats = asyncHandler(async (req, res) => {
    const stats = await QueueService.getAllQueueStats();

    success(res, stats);
  });

  /**
   * Clean queue
   */
  static cleanQueue = asyncHandler(async (req, res) => {
    const { queueName } = req.params;
    const { grace = 3600000 } = req.body;

    await QueueService.cleanQueue(queueName, grace);

    success(res, null, `Queue ${queueName} cleaned successfully`);
  });

  /**
   * Pause queue
   */
  static pauseQueue = asyncHandler(async (req, res) => {
    const { queueName } = req.params;

    await QueueService.pauseQueue(queueName);

    success(res, null, `Queue ${queueName} paused`);
  });

  /**
   * Resume queue
   */
  static resumeQueue = asyncHandler(async (req, res) => {
    const { queueName } = req.params;

    await QueueService.resumeQueue(queueName);

    success(res, null, `Queue ${queueName} resumed`);
  });

  /**
   * Sync current month only
   */
  static syncCurrentMonth = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const SalesOrderService = require('../services/SalesOrderService');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = now.toISOString().split('T')[0];

    const result = await SalesOrderService.syncFromAccurate(userId, {
      startDate,
      endDate,
      forceFullSync: false
    });

    success(res, result, `Current month (${year}-${month}) synced successfully`);
  });

  /**
   * Sync from March 2026 onwards (full sync)
   */
  static syncFromMarch2026 = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const SalesOrderService = require('../services/SalesOrderService');

    const now = new Date();
    const endDate = now.toISOString().split('T')[0];

    const result = await SalesOrderService.syncFromAccurate(userId, {
      startDate: '2026-03-01',
      endDate,
      forceFullSync: true
    });

    success(res, result, 'Full sync from March 2026 completed successfully');
  });
}

module.exports = SyncController;
