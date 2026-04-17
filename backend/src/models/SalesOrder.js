const { query, transaction } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class SalesOrder {
  /**
   * Find sales order by ID
   */
  static async findById(id) {
    const orders = await query(
      'SELECT * FROM sales_orders WHERE id = ? AND is_active = 1',
      [id]
    );
    return orders[0] || null;
  }

  /**
   * Find sales order by Accurate so_id
   */
  static async findBySoId(soId) {
    const orders = await query(
      'SELECT * FROM sales_orders WHERE so_id = ?',
      [soId]
    );
    return orders[0] || null;
  }

  /**
   * Transform database sales order to API format
   */
  static transformToApi(order) {
    if (!order) return null;
    
    return {
      id: order.id,
      soId: order.so_id,
      transNumber: order.nomor_so,
      transDate: order.tanggal_so,
      customerId: order.customer_id,
      customerName: order.nama_pelanggan,
      description: order.keterangan,
      status: order.status,
      totalAmount: parseFloat(order.total_amount || 0),
      currency: order.currency,
      lastSync: order.last_sync,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    };
  }

  /**
   * Get all sales orders with pagination and filters
   */
  static async findAll({ 
    page = 1, 
    limit = 20, 
    search = '', 
    status = null, 
    startDate = null, 
    endDate = null,
    sortBy = 'tanggal_so',
    sortOrder = 'desc'
  }) {
    // Ensure page and limit are integers
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = ['is_active = 1'];
    let params = [];

    if (search) {
      whereConditions.push('(nomor_so LIKE ? OR nama_pelanggan LIKE ? OR keterangan LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (startDate && endDate) {
      whereConditions.push('tanggal_so BETWEEN ? AND ?');
      params.push(startDate, endDate);
    } else if (startDate) {
      whereConditions.push('tanggal_so >= ?');
      params.push(startDate);
    } else if (endDate) {
      whereConditions.push('tanggal_so <= ?');
      params.push(endDate);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Validate sortBy
    const allowedSortFields = ['nomor_so', 'tanggal_so', 'nama_pelanggan', 'status', 'total_amount', 'last_sync'];
    if (!allowedSortFields.includes(sortBy)) {
      sortBy = 'tanggal_so';
    }

    // Validate sortOrder
    sortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM sales_orders ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get sales orders - use string interpolation for LIMIT/OFFSET
    // to avoid MySQL2 parameter binding issues with pagination values
    const orders = await query(
      `SELECT * FROM sales_orders ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );

    // Transform orders to API format
    const transformedOrders = orders.map(order => this.transformToApi(order));

    return {
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create or update sales order (upsert)
   */
  static async upsert(data) {
    const {
      so_id,
      nomor_so,
      tanggal_so,
      customer_id,
      nama_pelanggan,
      keterangan,
      status,
      total_amount,
      currency
    } = data;

    const existing = await this.findBySoId(so_id);

    if (existing) {
      // Update
      await query(
        `UPDATE sales_orders 
         SET nomor_so = ?, tanggal_so = ?, customer_id = ?, nama_pelanggan = ?,
             keterangan = ?, status = ?, total_amount = ?, currency = ?,
             last_sync = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE so_id = ?`,
        [nomor_so, tanggal_so, customer_id, nama_pelanggan, keterangan, status, total_amount, currency, so_id]
      );

      return await this.findBySoId(so_id);
    } else {
      // Insert
      await query(
        `INSERT INTO sales_orders 
         (so_id, nomor_so, tanggal_so, customer_id, nama_pelanggan, keterangan, status, total_amount, currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [so_id, nomor_so, tanggal_so, customer_id, nama_pelanggan, keterangan, status, total_amount, currency]
      );

      return await this.findBySoId(so_id);
    }
  }

  /**
   * Bulk upsert sales orders
   */
  static async bulkUpsert(orders) {
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        const existing = await this.findBySoId(order.so_id);
        if (existing) {
          await this.upsert(order);
          updated++;
        } else {
          await this.upsert(order);
          inserted++;
        }
      } catch (error) {
        logger.error('Error upserting sales order', { order, error: error.message });
        errors++;
      }
    }

    logger.info('Bulk upsert completed', { inserted, updated, errors, total: orders.length });

    return { inserted, updated, errors, total: orders.length };
  }

  /**
   * Get sales order with details
   */
  static async findByIdWithDetails(id) {
    const order = await this.findById(id);
    if (!order) {
      return null;
    }

    const details = await query(
      'SELECT * FROM sales_order_details WHERE sales_order_id = ?',
      [id]
    );

    return {
      ...order,
      details
    };
  }

  /**
   * Update sales order status
   */
  static async updateStatus(id, status) {
    const order = await this.findById(id);
    if (!order) {
      throw new AppError('Sales order not found', 404);
    }

    // Terima status sesuai Accurate (persis atau varian)
    const validStatuses = [
      'Menunggu Diproses', 'Menunggu diproses', 'Sebagian Terproses', 'Sebagian terproses', 
      'Sebagian Diproses', 'Sebagian diproses', 'Terproses',
      'Menunggu Proses', 'Dipesan', 'Diproses', 'Selesai'
    ];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    await query(
      'UPDATE sales_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    logger.info('Sales order status updated', { orderId: id, status });

    return await this.findById(id);
  }

  /**
   * Soft delete sales order
   */
  static async softDelete(id) {
    const order = await this.findById(id);
    if (!order) {
      throw new AppError('Sales order not found', 404);
    }

    await query(
      'UPDATE sales_orders SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    logger.info('Sales order soft deleted', { orderId: id });

    return true;
  }

  /**
   * Get sales order statistics
   */
  static async getStats({ startDate = null, endDate = null } = {}) {
    let whereConditions = ['is_active = 1'];
    let params = [];

    if (startDate && endDate) {
      whereConditions.push('tanggal_so BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const stats = await query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_sales,
        SUM(CASE WHEN status IN ('Menunggu Proses', 'Menunggu Diproses', 'Menunggu diproses', 'Dipesan') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status IN ('Sebagian Terproses', 'Sebagian terproses', 'Sebagian Diproses', 'Sebagian diproses', 'Diproses') THEN 1 ELSE 0 END) as partial,
        SUM(CASE WHEN status IN ('Terproses', 'Selesai') THEN 1 ELSE 0 END) as completed,
        AVG(total_amount) as average_order_value
      FROM sales_orders
      ${whereClause}
    `, params);

    return stats[0];
  }

  /**
   * Get sales by date range (for charts)
   */
  static async getSalesByDateRange(startDate, endDate) {
    const sales = await query(
      `SELECT 
         DATE(tanggal_so) as date,
         COUNT(*) as order_count,
         SUM(total_amount) as total_sales
       FROM sales_orders
       WHERE is_active = 1 AND tanggal_so BETWEEN ? AND ?
       GROUP BY DATE(tanggal_so)
       ORDER BY date`,
      [startDate, endDate]
    );

    return sales;
  }

  /**
   * Get top customers
   */
  static async getTopCustomers(limit = 10) {
    const customers = await query(
      `SELECT 
         nama_pelanggan,
         COUNT(*) as order_count,
         SUM(total_amount) as total_spent
       FROM sales_orders
       WHERE is_active = 1
       GROUP BY nama_pelanggan
       ORDER BY total_spent DESC
       LIMIT ?`,
      [limit]
    );

    return customers;
  }

  /**
   * Get pending orders
   */
  static async getPendingOrders(limit = 20) {
    const orders = await query(
      `SELECT * FROM sales_orders 
       WHERE is_active = 1 AND status IN ('Menunggu Proses', 'Menunggu Diproses', 'Menunggu diproses', 'Dipesan')
       ORDER BY tanggal_so DESC
       LIMIT ?`,
      [limit]
    );

    return orders;
  }

  /**
   * Search sales orders (fulltext search)
   */
  static async search(searchTerm, limit = 20) {
    const orders = await query(
      `SELECT *, MATCH(nomor_so, nama_pelanggan, keterangan) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
       FROM sales_orders
       WHERE is_active = 1 AND MATCH(nomor_so, nama_pelanggan, keterangan) AGAINST(? IN NATURAL LANGUAGE MODE)
       ORDER BY relevance DESC
       LIMIT ?`,
      [searchTerm, searchTerm, limit]
    );

    return orders;
  }

  /**
   * Update last sync timestamp
   */
  static async updateLastSync() {
    await query('UPDATE sync_config SET last_sync_sales_orders = CURRENT_TIMESTAMP WHERE id = 1');
  }
}

module.exports = SalesOrder;
