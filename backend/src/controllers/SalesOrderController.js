const SalesOrderService = require('../services/SalesOrderService');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

class SalesOrderController {
  static getAll = asyncHandler(async (req, res) => {
    const { page, limit, search, status, startDate, endDate, sortBy, sortOrder } = req.query;

    const result = await SalesOrderService.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });

    paginated(res, result.orders, result.pagination);
  });

  static getById = asyncHandler(async (req, res) => {
    const order = await SalesOrderService.getById(req.params.id);
    success(res, order);
  });

  static search = asyncHandler(async (req, res) => {
    const { q, limit } = req.query;
    const orders = await SalesOrderService.search(q, parseInt(limit) || 20);
    success(res, orders);
  });

  static getStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const stats = await SalesOrderService.getStats({ startDate, endDate });
    success(res, stats);
  });

  static getPending = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const orders = await SalesOrderService.getPendingOrders(parseInt(limit) || 20);
    success(res, orders);
  });

  static getTopCustomers = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const customers = await SalesOrderService.getTopCustomers(parseInt(limit) || 10);
    success(res, customers);
  });

  static updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await SalesOrderService.updateStatus(req.params.id, status);
    success(res, order, 'Status updated successfully');
  });

  static syncFromAccurate = asyncHandler(async (req, res) => {
    const { pageSize, startDate, endDate, forceFullSync } = req.body;

    const result = await SalesOrderService.syncFromAccurate(req.user.id, {
      pageSize: parseInt(pageSize) || 100,
      startDate,
      endDate,
      forceFullSync: forceFullSync === true
    });

    success(res, result, 'Sales orders synced successfully');
  });
}

module.exports = SalesOrderController;
