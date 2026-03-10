const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/stats', DashboardController.getStats);
router.get('/charts/sales', DashboardController.getSalesChart);
router.get('/charts/items', DashboardController.getItemsChart);
router.get('/recent-activities', DashboardController.getRecentActivities);

module.exports = router;
