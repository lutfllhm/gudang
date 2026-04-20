const express = require('express');
const router = express.Router();
const SalesOrderController = require('../controllers/SalesOrderController');
const { authenticate } = require('../middleware/auth');
const { syncLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(authenticate);

router.get('/', SalesOrderController.getAll);
router.get('/stats', SalesOrderController.getStats);
router.get('/pending', SalesOrderController.getPending);
router.get('/top-customers', SalesOrderController.getTopCustomers);
router.get('/search', SalesOrderController.search);
router.get('/:id', SalesOrderController.getById);
router.get('/:id/history', SalesOrderController.getHistory);
router.post('/:id/history', SalesOrderController.addHistory);
router.delete('/:id/history/:historyId', SalesOrderController.deleteHistory);
router.put('/:id/status', SalesOrderController.updateStatus);

// Sync routes
router.post('/sync', syncLimiter, SalesOrderController.syncFromAccurate);

module.exports = router;
