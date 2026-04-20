const SalesOrderService = require('../services/SalesOrderService');
const QueueService = require('../services/QueueService');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');
const SalesOrderHistory = require('../models/SalesOrderHistory');

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

  static getHistory = asyncHandler(async (req, res) => {
    const history = await SalesOrderHistory.findBySalesOrderId(req.params.id);
    const transformedHistory = history.map(h => SalesOrderHistory.transformToApi(h));
    success(res, transformedHistory);
  });

  static addHistory = asyncHandler(async (req, res) => {
    const { status, description, invoiceNumber } = req.body;
    const order = await SalesOrderService.getById(req.params.id);
    
    const historyId = await SalesOrderHistory.create({
      sales_order_id: order.id,
      so_id: order.soId,
      status,
      description,
      invoice_number: invoiceNumber,
      created_by: req.user?.nama || 'admin'
    });

    success(res, { id: historyId }, 'History added successfully');
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

    // Jalankan sync di background (queue) agar tidak timeout 504
    const options = {
      pageSize: parseInt(pageSize) || 100,
      startDate,
      endDate,
      forceFullSync: forceFullSync === true
    };
    const result = await QueueService.addSyncJob('sales-orders', req.user.id, options);

    success(res, {
      started: true,
      message: 'Sales orders sync dimulai di background. Refresh halaman nanti untuk melihat hasil.'
    }, 'Sales orders sync started');
  });

  static deleteHistory = asyncHandler(async (req, res) => {
    const { historyId } = req.params;
    await SalesOrderHistory.deleteBySalesOrderId(historyId);
    success(res, null, 'History deleted successfully');
  });
}

module.exports = SalesOrderController;
