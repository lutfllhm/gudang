const ItemService = require('../services/ItemService');
const SalesOrderService = require('../services/SalesOrderService');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');
const { query } = require('../config/database');

class DashboardController {
  static getStats = asyncHandler(async (req, res) => {
    const [itemStats, orderStats] = await Promise.all([
      ItemService.getStats(),
      SalesOrderService.getStats()
    ]);

    const stats = {
      items: itemStats,
      orders: orderStats
    };

    success(res, stats);
  });

  static getSalesChart = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const sales = await SalesOrderService.getSalesByDateRange(
      startDate || defaultStartDate,
      endDate || defaultEndDate
    );

    success(res, sales);
  });

  static getItemsChart = asyncHandler(async (req, res) => {
    const categories = await ItemService.getCategories();
    success(res, categories);
  });

  static getRecentActivities = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const activities = await query(
      `SELECT * FROM activity_logs 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    success(res, activities);
  });
}

module.exports = DashboardController;
