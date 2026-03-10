const express = require('express');
const router = express.Router();
const SyncController = require('../controllers/SyncController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get sync status
router.get('/status', SyncController.getStatus);

// Trigger manual sync
router.post('/trigger', SyncController.triggerSync);

// Sync specific entities
router.post('/items', SyncController.syncItems);
router.post('/sales-orders', SyncController.syncSalesOrders);

// Sync helpers
router.post('/current-month', SyncController.syncCurrentMonth);
router.post('/from-march-2026', SyncController.syncFromMarch2026);

// Update sync configuration
router.put('/config', SyncController.updateConfig);

// Queue management
router.get('/queue/stats', SyncController.getQueueStats);
router.post('/queue/:queueName/clean', SyncController.cleanQueue);
router.post('/queue/:queueName/pause', SyncController.pauseQueue);
router.post('/queue/:queueName/resume', SyncController.resumeQueue);

module.exports = router;
