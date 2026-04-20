const SalesOrder = require('../models/SalesOrder');
const ApiClient = require('./accurate/ApiClient');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { query } = require('../config/database');

class SalesOrderService {
  static unmappedAccurateStatuses = new Set();
  /**
   * Get all sales orders with pagination
   */
  static async getAll(filters) {
    return await SalesOrder.findAll(filters);
  }

  /**
   * Get sales order by ID
   */
  static async getById(id) {
    const order = await SalesOrder.findByIdWithDetails(id);
    
    if (!order) {
      throw new AppError('Sales order not found', 404);
    }

    return order;
  }

  /**
   * Search sales orders
   */
  static async search(searchTerm, limit = 20) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    return await SalesOrder.search(searchTerm, limit);
  }

  /**
   * Get sales order statistics
   */
  static async getStats(filters = {}) {
    return await SalesOrder.getStats(filters);
  }

  /**
   * Get sales by date range
   */
  static async getSalesByDateRange(startDate, endDate) {
    return await SalesOrder.getSalesByDateRange(startDate, endDate);
  }

  /**
   * Get top customers
   */
  static async getTopCustomers(limit = 10) {
    return await SalesOrder.getTopCustomers(limit);
  }

  /**
   * Get pending orders
   */
  static async getPendingOrders(limit = 20) {
    return await SalesOrder.getPendingOrders(limit);
  }

  /**
   * Update sales order status
   */
  static async updateStatus(id, status) {
    return await SalesOrder.updateStatus(id, status);
  }

  /**
   * Sync sales orders from Accurate Online
   */
  static async syncFromAccurate(userId, options = {}) {
    const {
      pageSize = 100,
      startDate = null,
      endDate = null,
      forceFullSync = false
    } = options;

    try {
      logger.info('Starting sales orders sync from Accurate', { userId, options });

      // Create sync log
      const syncLogResult = await query(
        'INSERT INTO sync_logs (sync_type, status, started_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        ['sales_orders', 'started']
      );
      const syncLogId = syncLogResult.insertId;

      let totalSynced = 0;
      let page = 1;
      let hasMore = true;

      // Untuk saat ini, NONAKTIFKAN filter date di Accurate
      // karena format filter menyebabkan error "Invalid field value for field 'filter'".
      // Lebih baik tarik semua data dulu sampai format resmi dari Accurate sudah pasti.
      let filter = null;
      const effectiveStartDate = startDate || '2026-03-01';
      const effectiveEndDate = endDate || new Date().toISOString().split('T')[0];

      logger.info('Sync date range (filter disabled, fetch all from Accurate)', { 
        effectiveStartDate,
        effectiveEndDate
      });

      while (hasMore) {
        try {
          // Get sales orders list from Accurate (only IDs)
          const params = {
            'sp.page': page,
            'sp.pageSize': pageSize
          };

          if (filter) {
            params.filter = filter;
          }

          logger.info('Fetching sales orders page', { page, params });

          const response = await ApiClient.get(userId, '/sales-order/list.do', params);

          if (!response) {
            const errorMsg = 'No response from Accurate API';
            logger.error(errorMsg, { page });
            throw new Error(errorMsg);
          }

          if (!response.d) {
            logger.warn('No data in response', { page, response });
            break;
          }

          const orders = Array.isArray(response.d) ? response.d : [];

          if (orders.length === 0) {
            hasMore = false;
            break;
          }

          logger.info('Retrieved sales orders list', { page, count: orders.length });

          // Fetch details for each sales order (with rate limiting handled by ApiClient)
          const detailedOrders = [];
          for (const order of orders) {
            try {
              const detailResponse = await ApiClient.get(userId, '/sales-order/detail.do', { id: order.id });
              if (detailResponse && detailResponse.d) {
                detailedOrders.push(detailResponse.d);
              } else {
                logger.warn('No detail data for order', { orderId: order.id });
              }
            } catch (error) {
              logger.warn('Failed to get sales order detail', { 
                orderId: order.id, 
                error: error.message,
                stack: error.stack 
              });
              // Continue with next order even if one fails
            }
          }

          if (detailedOrders.length === 0) {
            logger.warn('No detailed orders retrieved', { page });
            page++;
            continue;
          }

          // Transform and upsert sales orders
          const transformedOrders = detailedOrders.map(order => this.transformAccurateOrder(order));
          const result = await SalesOrder.bulkUpsert(transformedOrders);

          totalSynced += result.inserted + result.updated;

          logger.info('Sales orders page synced', { 
            page, 
            count: detailedOrders.length, 
            inserted: result.inserted, 
            updated: result.updated 
          });

          // Check if there are more pages
          if (orders.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }

        } catch (error) {
          const errorMsg = `Error syncing sales orders page ${page}: ${error.message}`;
          logger.error(errorMsg, { 
            page, 
            error: error.message,
            stack: error.stack 
          });
          
          // Update sync log with error
          await query(
            'UPDATE sync_logs SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['failed', errorMsg, syncLogId]
          );

          throw new Error(errorMsg);
        }
      }

      // Update last sync timestamp
      await SalesOrder.updateLastSync();

      // Update sync log
      const duration = await this.calculateSyncDuration(syncLogId);
      await query(
        'UPDATE sync_logs SET status = ?, records_synced = ?, completed_at = CURRENT_TIMESTAMP, duration_seconds = ? WHERE id = ?',
        ['success', totalSynced, duration, syncLogId]
      );

      logger.info('Sales orders sync completed', { totalSynced, duration });

      return {
        success: true,
        synced: totalSynced,
        duration,
        dateRange: {
          startDate: effectiveStartDate,
          endDate: effectiveEndDate
        }
      };

    } catch (error) {
      logger.error('Sales orders sync failed', { 
        error: error.message,
        stack: error.stack 
      });
      
      // Return more detailed error
      const errorMessage = error.message || 'Unknown error occurred during sync';
      throw new AppError(`Failed to sync sales orders: ${errorMessage}`, 500);
    }
  }

  /**
   * Transform Accurate sales order to our format.
   * Status diambil persis dari Accurate Online agar tampilan sama (Menunggu diproses, Sebagian terproses, Terproses).
   */
  static transformAccurateOrder(accurateOrder) {
    // Ambil status dari semua kemungkinan field response API Accurate
    // Accurate Online bisa mengirim status sebagai object {id, name} atau string langsung
    const extractStatusStr = (val) => {
      if (val == null) return null;
      if (typeof val === 'object') return val.name ?? val.code ?? val.value ?? null;
      return String(val).trim() || null;
    };

    const rawStatus =
      extractStatusStr(accurateOrder?.documentStatus) ??
      extractStatusStr(accurateOrder?.documentStatusName) ??
      extractStatusStr(accurateOrder?.transStatusName) ??
      extractStatusStr(accurateOrder?.statusName) ??
      extractStatusStr(accurateOrder?.status_label) ??
      extractStatusStr(accurateOrder?.state) ??
      extractStatusStr(accurateOrder?.statusCode) ??
      extractStatusStr(accurateOrder?.status_code) ??
      extractStatusStr(accurateOrder?.status);

    const rawStr = rawStatus == null ? '' : String(rawStatus).trim();
    const normalizedStatus = rawStr.toUpperCase();

    // Log INFO (bukan debug) agar selalu muncul di log - untuk diagnosa status Accurate
    logger.info('Accurate order status mapping', {
      orderId: accurateOrder?.id,
      transNumber: accurateOrder?.transNumber ?? accurateOrder?.number,
      rawStatus: rawStr,
      normalizedStatus,
      allStatusFields: {
        documentStatus: accurateOrder?.documentStatus,
        documentStatusName: accurateOrder?.documentStatusName,
        transStatusName: accurateOrder?.transStatusName,
        statusName: accurateOrder?.statusName,
        status: accurateOrder?.status,
        state: accurateOrder?.state,
      }
    });

    // Mapping status Accurate -> label baku aplikasi
    // Accurate Online mengirim: "Terproses", "Sebagian diproses", "Menunggu diproses"
    // Kita normalkan ke 3 label baku tersebut agar konsisten dengan tampilan Accurate.
    const completedSet = [
      'CLOSED', 'CLOSE', 'COMPLETED', 'COMPLETE', 'FINISHED', 'DONE',
      'SELESAI', 'TERPROSES', 'FULLY PROCESSED', 'FULLY_PROCESSED'
    ];
    const partialSet = [
      'PARTIAL', 'PARTIALLY', 'PARTIAL_COMPLETED', 'PARTIAL_COMPLETE',
      'SEBAGIAN', 'SEBAGIAN TERPROSES', 'SEBAGIAN_TERPROSES',
      'SEBAGIAN DIPROSES', 'SEBAGIAN_DIPROSES',
      'IN PROGRESS', 'IN_PROGRESS', 'PROCESSING',
      'PARTIALLY PROCESSED', 'PARTIALLY_PROCESSED'
    ];
    const pendingSet = [
      'DIPESAN', 'OPEN', 'OPENED', 'PENDING', 'MENUNGGU',
      'MENUNGGU PROSES', 'MENUNGGU DIPROSES', 'MENUNGGU_DIPROSES',
      'NEW', 'DRAFT', 'WAITING', 'QUEUE'
    ];

    let status = 'Menunggu diproses';
    if (completedSet.includes(normalizedStatus)) {
      status = 'Terproses';
    } else if (partialSet.includes(normalizedStatus)) {
      status = 'Sebagian diproses';
    } else if (pendingSet.includes(normalizedStatus)) {
      status = 'Menunggu diproses';
    } else if (rawStr) {
      // Nilai dari Accurate yang tidak kita kenal: simpan apa adanya
      status = rawStr;
      if (!SalesOrderService.unmappedAccurateStatuses.has(normalizedStatus)) {
        SalesOrderService.unmappedAccurateStatuses.add(normalizedStatus);
        logger.warn('UNMAPPED Accurate status - perlu ditambahkan ke mapping!', {
          accurateOrderId: accurateOrder?.id,
          rawStatus: rawStr,
          normalizedStatus
        });
      }
    }

    logger.info('Status mapping result', {
      orderId: accurateOrder?.id,
      transNumber: accurateOrder?.transNumber ?? accurateOrder?.number,
      rawStatus: rawStr,
      mappedStatus: status
    });

    // Convert date from DD/MM/YYYY to YYYY-MM-DD
    let tanggalSo = new Date().toISOString().split('T')[0];
    if (accurateOrder.transDate) {
      try {
        const parts = accurateOrder.transDate.split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY -> YYYY-MM-DD
          tanggalSo = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } catch (error) {
        logger.warn('Failed to parse date', { transDate: accurateOrder.transDate, error: error.message });
      }
    }

    // Get customer name from customer object or direct field
    let customerName = 'Unknown';
    if (accurateOrder.customer && accurateOrder.customer.name) {
      customerName = accurateOrder.customer.name;
    } else if (accurateOrder.customerName) {
      customerName = accurateOrder.customerName;
    }

    // Get currency code
    let currencyCode = 'IDR';
    if (accurateOrder.currency && accurateOrder.currency.code) {
      currencyCode = accurateOrder.currency.code;
    } else if (accurateOrder.currency && typeof accurateOrder.currency === 'string') {
      currencyCode = accurateOrder.currency;
    }

    return {
      so_id: String(accurateOrder.id || accurateOrder.orderId),
      nomor_so: accurateOrder.number || accurateOrder.transNumber || accurateOrder.orderNumber || accurateOrder.soNumber || '',
      tanggal_so: tanggalSo,
      customer_id: String(accurateOrder.customerId || ''),
      nama_pelanggan: customerName,
      keterangan: accurateOrder.description || null,
      status: status,
      total_amount: parseFloat(accurateOrder.totalAmount || accurateOrder.total || 0),
      currency: currencyCode
    };
  }

  /**
   * Get sales order from Accurate by ID
   */
  static async getFromAccurate(userId, soId) {
    try {
      const response = await ApiClient.get(userId, '/sales-order/detail.do', { id: soId });

      if (!response || !response.d) {
        throw new AppError('Sales order not found in Accurate', 404);
      }

      return this.transformAccurateOrder(response.d);
    } catch (error) {
      logger.error('Error getting sales order from Accurate', { soId, error: error.message });
      throw new AppError('Failed to get sales order from Accurate', 500);
    }
  }

  /**
   * Calculate sync duration
   */
  static async calculateSyncDuration(syncLogId) {
    const result = await query(
      'SELECT TIMESTAMPDIFF(SECOND, started_at, CURRENT_TIMESTAMP) as duration FROM sync_logs WHERE id = ?',
      [syncLogId]
    );
    return result[0]?.duration || 0;
  }

  /**
   * Sync single sales order from Accurate (untuk webhook)
   */
  static async syncSingleOrder(soId) {
    try {
      logger.info('Syncing single sales order from Accurate', { soId });

      // Get user ID (ambil user dengan token yang masih valid)
      const userResult = await query(
        'SELECT user_id FROM accurate_tokens WHERE is_active = 1 AND expires_at > NOW() ORDER BY id DESC LIMIT 1'
      );

      if (userResult.length === 0) {
        throw new AppError('No user with Accurate token found', 404);
      }

      const userId = userResult[0].user_id;

      // Get sales order from Accurate
      const accurateOrder = await this.getFromAccurate(userId, soId);

      // Upsert sales order
      const result = await SalesOrder.bulkUpsert([accurateOrder]);

      logger.info('Single sales order synced', { 
        soId, 
        inserted: result.inserted, 
        updated: result.updated 
      });

      return {
        success: true,
        soId,
        action: result.inserted > 0 ? 'inserted' : 'updated'
      };

    } catch (error) {
      logger.error('Failed to sync single sales order', { soId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete sales order (untuk webhook)
   */
  static async deleteOrder(soId) {
    try {
      logger.info('Deleting sales order', { soId });

      const result = await query(
        'DELETE FROM sales_orders WHERE so_id = ?',
        [String(soId)]
      );

      logger.info('Sales order deleted', { soId, affectedRows: result.affectedRows });

      return {
        success: true,
        soId,
        deleted: result.affectedRows > 0
      };

    } catch (error) {
      logger.error('Failed to delete sales order', { soId, error: error.message });
      throw error;
    }
  }

  /**
   * Get sales invoices for a sales order from Accurate
   */
  static async getSalesInvoicesForOrder(userId, soId) {
    try {
      logger.info('Getting sales invoices for order', { soId });

      // Get sales invoices from Accurate API
      // Filter by sales order reference
      const response = await ApiClient.get(userId, '/sales-invoice/list.do', {
        'sp.page': 1,
        'sp.pageSize': 100,
        filter: `salesOrderId=${soId}`
      });

      if (!response || !response.d) {
        return [];
      }

      const invoices = Array.isArray(response.d) ? response.d : [];
      
      // Get details for each invoice
      const detailedInvoices = [];
      for (const invoice of invoices) {
        try {
          const detailResponse = await ApiClient.get(userId, '/sales-invoice/detail.do', { id: invoice.id });
          if (detailResponse && detailResponse.d) {
            logger.info('Sales invoice detail received', { 
              invoiceId: invoice.id, 
              fields: Object.keys(detailResponse.d),
              createdBy: detailResponse.d.createdBy,
              createdByName: detailResponse.d.createdByName,
              userName: detailResponse.d.userName
            });
            detailedInvoices.push(detailResponse.d);
          }
        } catch (error) {
          logger.warn('Failed to get invoice detail', { invoiceId: invoice.id, error: error.message });
        }
      }

      return detailedInvoices;

    } catch (error) {
      logger.error('Failed to get sales invoices', { soId, error: error.message });
      return [];
    }
  }

  /**
   * Sync sales invoices for a sales order
   */
  static async syncInvoicesForOrder(userId, soId) {
    try {
      logger.info('Syncing invoices for order', { soId });

      // Get sales order from database
      const orderResult = await query(
        'SELECT id FROM sales_orders WHERE so_id = ?',
        [String(soId)]
      );

      if (orderResult.length === 0) {
        throw new AppError('Sales order not found in database', 404);
      }

      const salesOrderId = orderResult[0].id;

      // Get invoices from Accurate
      const invoices = await this.getSalesInvoicesForOrder(userId, soId);

      if (invoices.length === 0) {
        return { success: true, synced: 0 };
      }

      // Transform and upsert invoices
      let synced = 0;
      for (const invoice of invoices) {
        try {
          // Convert date from DD/MM/YYYY to YYYY-MM-DD
          let tanggalFaktur = new Date().toISOString().split('T')[0];
          if (invoice.transDate) {
            const parts = invoice.transDate.split('/');
            if (parts.length === 3) {
              tanggalFaktur = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }

          // Get currency code
          let currencyCode = 'IDR';
          if (invoice.currency && invoice.currency.code) {
            currencyCode = invoice.currency.code;
          } else if (invoice.currency && typeof invoice.currency === 'string') {
            currencyCode = invoice.currency;
          }

          // Get created by name
          let createdByName = null;
          if (invoice.createdBy && typeof invoice.createdBy === 'object') {
            createdByName = invoice.createdBy.name || invoice.createdBy.displayName || invoice.createdBy.userName;
          } else if (invoice.createdByName) {
            createdByName = invoice.createdByName;
          } else if (invoice.createdBy && typeof invoice.createdBy === 'string') {
            createdByName = invoice.createdBy;
          } else if (invoice.userName) {
            createdByName = invoice.userName;
          } else if (invoice.userDisplayName) {
            createdByName = invoice.userDisplayName;
          }

          await query(
            `INSERT INTO sales_invoices 
            (invoice_id, sales_order_id, nomor_faktur, tanggal_faktur, total_amount, currency, created_by_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            nomor_faktur = VALUES(nomor_faktur),
            tanggal_faktur = VALUES(tanggal_faktur),
            total_amount = VALUES(total_amount),
            currency = VALUES(currency),
            created_by_name = VALUES(created_by_name),
            updated_at = CURRENT_TIMESTAMP`,
            [
              String(invoice.id),
              salesOrderId,
              invoice.number || invoice.transNumber || '',
              tanggalFaktur,
              parseFloat(invoice.totalAmount || invoice.total || 0),
              currencyCode,
              createdByName
            ]
          );

          synced++;
        } catch (error) {
          logger.warn('Failed to upsert invoice', { invoiceId: invoice.id, error: error.message });
        }
      }

      logger.info('Invoices synced for order', { soId, synced });

      return { success: true, synced };

    } catch (error) {
      logger.error('Failed to sync invoices', { soId, error: error.message });
      throw error;
    }
  }

  /**
   * Get sales invoices for a sales order from database
   */
  static async getInvoicesForOrder(soId) {
    try {
      const result = await query(
        `SELECT si.* 
        FROM sales_invoices si
        JOIN sales_orders so ON si.sales_order_id = so.id
        WHERE so.so_id = ?
        ORDER BY si.tanggal_faktur DESC`,
        [String(soId)]
      );

      return result;

    } catch (error) {
      logger.error('Failed to get invoices from database', { soId, error: error.message });
      return [];
    }
  }
}

module.exports = SalesOrderService;
