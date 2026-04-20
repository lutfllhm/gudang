const { query } = require('../config/database');
const logger = require('../utils/logger');

class SalesInvoiceHistory {
  /**
   * Create new history entry
   */
  static async create(data) {
    const {
      sales_order_id,
      so_id,
      invoice_number,
      invoice_date,
      action_type,
      status,
      modified_by,
      modified_by_id,
      description,
      accurate_data
    } = data;

    try {
      const result = await query(
        `INSERT INTO sales_invoice_history 
         (sales_order_id, so_id, invoice_number, invoice_date, action_type, status, 
          modified_by, modified_by_id, description, accurate_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sales_order_id,
          so_id,
          invoice_number,
          invoice_date,
          action_type,
          status,
          modified_by,
          modified_by_id,
          description,
          accurate_data ? JSON.stringify(accurate_data) : null
        ]
      );

      logger.info('Sales invoice history created', { 
        historyId: result.insertId, 
        soId: so_id,
        invoiceNumber: invoice_number 
      });

      return result.insertId;
    } catch (error) {
      logger.error('Failed to create sales invoice history', { 
        error: error.message,
        data 
      });
      throw error;
    }
  }

  /**
   * Get history by sales order ID
   */
  static async getBySalesOrderId(salesOrderId) {
    try {
      const histories = await query(
        `SELECT * FROM v_sales_invoice_history 
         WHERE sales_order_id = ? 
         ORDER BY created_at DESC`,
        [salesOrderId]
      );

      return histories.map(h => ({
        ...h,
        accurate_data: h.accurate_data ? JSON.parse(h.accurate_data) : null
      }));
    } catch (error) {
      logger.error('Failed to get sales invoice history', { 
        error: error.message,
        salesOrderId 
      });
      throw error;
    }
  }

  /**
   * Get history by SO ID (Accurate ID)
   */
  static async getBySoId(soId) {
    try {
      const histories = await query(
        `SELECT * FROM v_sales_invoice_history 
         WHERE so_id = ? 
         ORDER BY created_at DESC`,
        [soId]
      );

      return histories.map(h => ({
        ...h,
        accurate_data: h.accurate_data ? JSON.parse(h.accurate_data) : null
      }));
    } catch (error) {
      logger.error('Failed to get sales invoice history by SO ID', { 
        error: error.message,
        soId 
      });
      throw error;
    }
  }

  /**
   * Get recent history (for dashboard/monitoring)
   */
  static async getRecent(limit = 50) {
    try {
      const histories = await query(
        `SELECT * FROM v_sales_invoice_history 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [limit]
      );

      return histories.map(h => ({
        ...h,
        accurate_data: h.accurate_data ? JSON.parse(h.accurate_data) : null
      }));
    } catch (error) {
      logger.error('Failed to get recent sales invoice history', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get history by status (e.g., "Sebagian diproses")
   */
  static async getByStatus(status, limit = 100) {
    try {
      const histories = await query(
        `SELECT * FROM v_sales_invoice_history 
         WHERE current_status = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [status, limit]
      );

      return histories.map(h => ({
        ...h,
        accurate_data: h.accurate_data ? JSON.parse(h.accurate_data) : null
      }));
    } catch (error) {
      logger.error('Failed to get sales invoice history by status', { 
        error: error.message,
        status 
      });
      throw error;
    }
  }

  /**
   * Delete old history (cleanup)
   */
  static async deleteOlderThan(days) {
    try {
      const result = await query(
        `DELETE FROM sales_invoice_history 
         WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      );

      logger.info('Old sales invoice history deleted', { 
        days,
        deletedRows: result.affectedRows 
      });

      return result.affectedRows;
    } catch (error) {
      logger.error('Failed to delete old sales invoice history', { 
        error: error.message,
        days 
      });
      throw error;
    }
  }
}

module.exports = SalesInvoiceHistory;
