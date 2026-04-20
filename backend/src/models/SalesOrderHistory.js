const { query } = require('../config/database');
const logger = require('../utils/logger');

class SalesOrderHistory {
  /**
   * Create new history entry
   */
  static async create(data) {
    const {
      sales_order_id,
      so_id,
      status,
      description,
      invoice_number = null,
      created_by = 'system'
    } = data;

    const result = await query(
      `INSERT INTO sales_order_history 
       (sales_order_id, so_id, status, description, invoice_number, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sales_order_id, so_id, status, description, invoice_number, created_by]
    );

    logger.info('Sales order history created', { 
      historyId: result.insertId, 
      sales_order_id, 
      status 
    });

    return result.insertId;
  }

  /**
   * Get history by sales order ID
   */
  static async findBySalesOrderId(salesOrderId) {
    const history = await query(
      `SELECT * FROM sales_order_history 
       WHERE sales_order_id = ?
       ORDER BY created_at DESC`,
      [salesOrderId]
    );

    return history;
  }

  /**
   * Get history by SO ID (Accurate ID)
   */
  static async findBySoId(soId) {
    const history = await query(
      `SELECT * FROM sales_order_history 
       WHERE so_id = ?
       ORDER BY created_at DESC`,
      [soId]
    );

    return history;
  }

  /**
   * Get latest history entry for a sales order
   */
  static async getLatest(salesOrderId) {
    const history = await query(
      `SELECT * FROM sales_order_history 
       WHERE sales_order_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [salesOrderId]
    );

    return history[0] || null;
  }

  /**
   * Delete history entries for a sales order
   */
  static async deleteBySalesOrderId(salesOrderId) {
    const result = await query(
      'DELETE FROM sales_order_history WHERE sales_order_id = ?',
      [salesOrderId]
    );

    logger.info('Sales order history deleted', { 
      salesOrderId, 
      affectedRows: result.affectedRows 
    });

    return result.affectedRows;
  }

  /**
   * Transform history to API format
   */
  static transformToApi(history) {
    if (!history) return null;

    return {
      id: history.id,
      salesOrderId: history.sales_order_id,
      soId: history.so_id,
      status: history.status,
      description: history.description,
      invoiceNumber: history.invoice_number,
      createdBy: history.created_by,
      createdAt: history.created_at
    };
  }
}

module.exports = SalesOrderHistory;
