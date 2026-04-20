const SalesInvoiceHistory = require('../models/SalesInvoiceHistory');
const CustomerService = require('../services/CustomerService');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

class SalesInvoiceHistoryController {
  /**
   * Get history by sales order ID
   */
  static getByOrderId = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const history = await SalesInvoiceHistory.getBySalesOrderId(orderId);
    success(res, history);
  });

  /**
   * Get history by SO ID (Accurate ID)
   */
  static getBySoId = asyncHandler(async (req, res) => {
    const { soId } = req.params;
    const history = await SalesInvoiceHistory.getBySoId(soId);
    success(res, history);
  });

  /**
   * Get recent history
   */
  static getRecent = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const history = await SalesInvoiceHistory.getRecent(parseInt(limit) || 50);
    success(res, history);
  });

  /**
   * Get history by status
   */
  static getByStatus = asyncHandler(async (req, res) => {
    const { status } = req.params;
    const { limit } = req.query;
    const history = await SalesInvoiceHistory.getByStatus(
      status, 
      parseInt(limit) || 100
    );
    success(res, history);
  });

  /**
   * Sync invoice history from Accurate
   */
  static syncHistory = asyncHandler(async (req, res) => {
    const { startDate, endDate, pageSize } = req.body;
    
    const result = await CustomerService.syncInvoiceHistory(req.user.id, {
      startDate,
      endDate,
      pageSize: parseInt(pageSize) || 100
    });

    success(res, result, 'Invoice history sync completed');
  });
}

module.exports = SalesInvoiceHistoryController;
