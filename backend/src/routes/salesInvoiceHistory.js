const express = require('express');
const router = express.Router();
const SalesInvoiceHistoryController = require('../controllers/SalesInvoiceHistoryController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get history by sales order ID
router.get('/order/:orderId', SalesInvoiceHistoryController.getByOrderId);

// Get history by SO ID (Accurate ID)
router.get('/so/:soId', SalesInvoiceHistoryController.getBySoId);

// Get recent history
router.get('/recent', SalesInvoiceHistoryController.getRecent);

// Get history by status
router.get('/status/:status', SalesInvoiceHistoryController.getByStatus);

// Sync invoice history from Accurate
router.post('/sync', SalesInvoiceHistoryController.syncHistory);

module.exports = router;
