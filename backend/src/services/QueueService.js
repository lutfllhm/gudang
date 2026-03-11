const config = require('../config');
const logger = require('../utils/logger');

// Check if Redis is available
let Queue;
let redisAvailable = false;

try {
  Queue = require('bull');
  redisAvailable = true;
} catch (error) {
  logger.warn('Bull/Redis not available. Queue functionality will be disabled.');
  logger.warn('Install with: npm install bull ioredis');
}

class QueueService {
  constructor() {
    this.queues = {};
    
    if (redisAvailable) {
      try {
        this.initQueues();
      } catch (error) {
        logger.error('Failed to initialize queues:', error.message);
        logger.warn('Queue functionality will be disabled');
        redisAvailable = false;
      }
    }
  }

  initQueues() {
    if (!redisAvailable) {
      return;
    }
    // Accurate API Queue
    this.queues.accurateApi = new Queue('accurate-api', {
      redis: {
        host: config.redis?.host || '127.0.0.1',
        port: config.redis?.port || 6379,
        password: config.redis?.password || undefined,
        db: config.redis?.db || 0
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    });

    // Sync Queue
    this.queues.sync = new Queue('sync', {
      redis: {
        host: config.redis?.host || '127.0.0.1',
        port: config.redis?.port || 6379,
        password: config.redis?.password || undefined,
        db: config.redis?.db || 0
      },
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000
        },
        removeOnComplete: 50,
        removeOnFail: 200
      }
    });

    this.setupProcessors();
    this.setupEventListeners();
  }

  setupProcessors() {
    // Accurate API processor
    this.queues.accurateApi.process(async (job) => {
      const { userId, method, endpoint, data, params } = job.data;
      
      logger.info('Processing Accurate API job', { 
        jobId: job.id, 
        method, 
        endpoint 
      });

      // Import ApiClient here to avoid circular dependency
      const ApiClient = require('./accurate/ApiClient');
      
      try {
        const result = await ApiClient.request(userId, method, endpoint, data, params);
        return result;
      } catch (error) {
        logger.error('Accurate API job failed', { 
          jobId: job.id, 
          error: error.message 
        });
        throw error;
      }
    });

    // Sync processor
    this.queues.sync.process(async (job) => {
      const { type, userId } = job.data;
      
      logger.info('Processing sync job', { 
        jobId: job.id, 
        type 
      });

      // Import services here to avoid circular dependency
      const ItemService = require('./ItemService');
      const SalesOrderService = require('./SalesOrderService');

      try {
        if (type === 'items') {
          await ItemService.syncFromAccurate(userId);
        } else if (type === 'sales-orders' || type === 'sales_orders') {
          await SalesOrderService.syncFromAccurate(userId);
        } else if (type === 'full') {
          await ItemService.syncFromAccurate(userId);
          await SalesOrderService.syncFromAccurate(userId);
        }
        
        return { success: true, type };
      } catch (error) {
        logger.error('Sync job failed', { 
          jobId: job.id, 
          type,
          error: error.message 
        });
        throw error;
      }
    });
  }

  setupEventListeners() {
    Object.entries(this.queues).forEach(([name, queue]) => {
      queue.on('completed', (job, result) => {
        logger.info(`Queue ${name} job completed`, { 
          jobId: job.id,
          result: typeof result === 'object' ? JSON.stringify(result).substring(0, 100) : result
        });
      });

      queue.on('failed', (job, err) => {
        logger.error(`Queue ${name} job failed`, { 
          jobId: job.id,
          error: err.message,
          attempts: job.attemptsMade
        });
      });

      queue.on('stalled', (job) => {
        logger.warn(`Queue ${name} job stalled`, { jobId: job.id });
      });
    });
  }

  /**
   * Add Accurate API request to queue
   */
  async addAccurateApiJob(userId, method, endpoint, data = null, params = null) {
    if (!redisAvailable) {
      logger.warn('Queue not available, executing directly');
      const ApiClient = require('./accurate/ApiClient');
      return await ApiClient.request(userId, method, endpoint, data, params);
    }
    
    const job = await this.queues.accurateApi.add({
      userId,
      method,
      endpoint,
      data,
      params
    }, {
      priority: method === 'GET' ? 2 : 1
    });

    logger.info('Accurate API job added to queue', { 
      jobId: job.id, 
      method, 
      endpoint 
    });

    return job;
  }

  /**
   * Add sync job to queue
   */
  async addSyncJob(type, userId, options = {}) {
    if (!redisAvailable) {
      logger.warn('Queue not available, executing sync directly');
      const ItemService = require('./ItemService');
      const SalesOrderService = require('./SalesOrderService');
      
      if (type === 'items') {
        return await ItemService.syncFromAccurate(userId);
      } else if (type === 'sales-orders' || type === 'sales_orders') {
        return await SalesOrderService.syncFromAccurate(userId);
      } else if (type === 'full') {
        await ItemService.syncFromAccurate(userId);
        return await SalesOrderService.syncFromAccurate(userId);
      }
    }
    
    const job = await this.queues.sync.add({
      type,
      userId
    }, {
      ...options,
      jobId: `sync-${type}-${userId}-${Date.now()}`
    });

    logger.info('Sync job added to queue', { 
      jobId: job.id, 
      type 
    });

    return job;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    if (!redisAvailable) {
      return { error: 'Queue not available' };
    }
    
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    if (!redisAvailable) {
      return { error: 'Queue not available' };
    }
    
    const stats = {};
    
    for (const [name, queue] of Object.entries(this.queues)) {
      stats[name] = await this.getQueueStats(name);
    }

    return stats;
  }

  /**
   * Clean completed jobs
   */
  async cleanQueue(queueName, grace = 3600000) {
    if (!redisAvailable) {
      return;
    }
    
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
    
    logger.info(`Queue ${queueName} cleaned`, { grace });
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName) {
    if (!redisAvailable) {
      return;
    }
    
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName) {
    if (!redisAvailable) {
      return;
    }
    
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  }

  /**
   * Close all queues
   */
  async closeAll() {
    if (!redisAvailable) {
      return;
    }
    
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        await queue.close();
        logger.info(`Queue ${name} closed`);
      } catch (error) {
        logger.warn(`Failed to close queue ${name}:`, error.message);
      }
    }
  }
}

module.exports = new QueueService();
