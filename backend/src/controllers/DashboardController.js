const ItemService = require('../services/ItemService');
const SalesOrderService = require('../services/SalesOrderService');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');
const { query } = require('../config/database');

class DashboardController {
  static getStats = asyncHandler(async (req, res) => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate7d = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      itemStatsRaw,
      salesOrderStatsRaw,
      itemsInStockRows,
      salesOrdersThisMonthRows,
      salesChartRaw,
      recentOrdersPaged,
      syncConfigRows,
      activeTokenRows
    ] = await Promise.all([
      ItemService.getStats(),
      SalesOrderService.getStats(),
      query('SELECT COUNT(*) as inStock FROM items WHERE is_active = 1 AND stok_tersedia > 0'),
      query(
        `SELECT COUNT(*) as thisMonth
         FROM sales_orders
         WHERE is_active = 1
           AND YEAR(tanggal_so) = YEAR(CURDATE())
           AND MONTH(tanggal_so) = MONTH(CURDATE())`
      ),
      SalesOrderService.getSalesByDateRange(startDate7d, endDate),
      SalesOrderService.getAll({ page: 1, limit: 5, sortBy: 'tanggal_so', sortOrder: 'desc' }),
      query('SELECT * FROM sync_config WHERE id = 1'),
      query(
        // Jangan pakai `expires_at > NOW()` karena access token bisa expire tapi masih bisa di-refresh.
        'SELECT id FROM accurate_tokens WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
      )
    ]);

    const items = {
      total: Number(itemStatsRaw?.total_items || 0),
      inStock: Number(itemsInStockRows?.[0]?.inStock || 0),
      totalStock: Number(itemStatsRaw?.total_stock || 0),
      outOfStock: Number(itemStatsRaw?.out_of_stock || 0),
      lowStock: Number(itemStatsRaw?.low_stock || 0),
      totalCategories: Number(itemStatsRaw?.total_categories || 0)
    };

    const salesOrders = {
      total: Number(salesOrderStatsRaw?.total_orders || 0),
      thisMonth: Number(salesOrdersThisMonthRows?.[0]?.thisMonth || 0),
      totalRevenue: Number(salesOrderStatsRaw?.total_sales || 0),
      pending: Number(salesOrderStatsRaw?.pending || 0),
      partial: Number(salesOrderStatsRaw?.partial || 0),
      completed: Number(salesOrderStatsRaw?.completed || 0),
      averageOrderValue: Number(salesOrderStatsRaw?.average_order_value || 0)
    };

    const salesChart = Array.isArray(salesChartRaw)
      ? salesChartRaw.map((row) => ({
          date: row.date,
          total: Number(row.total_sales || 0),
          count: Number(row.order_count || 0)
        }))
      : [];

    const syncConfig = syncConfigRows?.[0];
    const lastSync =
      syncConfig?.last_sync_sales_orders ||
      syncConfig?.last_sync_items ||
      null;

    const accurateStatus = {
      connected: (activeTokenRows?.length || 0) > 0,
      lastSync
    };

    const stats = {
      items,
      salesOrders,
      salesChart,
      recentOrders: recentOrdersPaged?.orders || [],
      accurateStatus
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
