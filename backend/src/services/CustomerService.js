const ApiClient = require('./accurate/ApiClient');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const SalesInvoiceHistory = require('../models/SalesInvoiceHistory');
const SalesOrder = require('../models/SalesOrder');

class CustomerService {
  /**
   * Get customer list from Accurate
   * Endpoint: /api/customer/list.do
   */
  static async getCustomerList(userId, options = {}) {
    const {
      page = 1,
      pageSize = 100,
      filter = null
    } = options;

    try {
      logger.info('Fetching customer list from Accurate', { userId, page, pageSize });

      const params = {
        'sp.page': page,
        'sp.pageSize': pageSize
      };

      if (filter) {
        params.filter = filter;
      }

      const response = await ApiClient.get(userId, '/customer/list.do', params);

      if (!response || !response.d) {
        throw new AppError('No customer data from Accurate', 404);
      }

      const customers = Array.isArray(response.d) ? response.d : [];

      logger.info('Customer list fetched', { 
        count: customers.length,
        page 
      });

      return {
        customers,
        hasMore: customers.length >= pageSize
      };

    } catch (error) {
      logger.error('Failed to get customer list from Accurate', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * Get customer detail from Accurate
   * Endpoint: /api/customer/detail.do
   */
  static async getCustomerDetail(userId, customerId) {
    try {
      logger.info('Fetching customer detail from Accurate', { userId, customerId });

      const response = await ApiClient.get(userId, '/customer/detail.do', { 
        id: customerId 
      });

      if (!response || !response.d) {
        throw new AppError('Customer not found in Accurate', 404);
      }

      logger.info('Customer detail fetched', { customerId });

      return response.d;

    } catch (error) {
      logger.error('Failed to get customer detail from Accurate', { 
        error: error.message,
        userId,
        customerId 
      });
      throw error;
    }
  }

  /**
   * Sync sales invoice history from Accurate
   * Mengambil data dari /api/customer/list.do dan mencari perubahan faktur
   */
  static async syncInvoiceHistory(userId, options = {}) {
    const {
      startDate = null,
      endDate = null,
      pageSize = 100
    } = options;

    try {
      logger.info('Starting invoice history sync from Accurate', { userId, options });

      let totalSynced = 0;
      let page = 1;
      let hasMore = true;

      // Build filter untuk date range jika ada
      let filter = null;
      if (startDate && endDate) {
        // Format filter sesuai dokumentasi Accurate
        filter = `filter.lastUpdate.op=BETWEEN&filter.lastUpdate.val[0]=${startDate}&filter.lastUpdate.val[1]=${endDate}`;
      }

      while (hasMore) {
        try {
          // Get customer list (yang berisi info transaksi terakhir)
          const { customers, hasMore: more } = await this.getCustomerList(userId, {
            page,
            pageSize,
            filter
          });

          hasMore = more;

          // Untuk setiap customer, ambil sales orders terkait
          for (const customer of customers) {
            try {
              // Cari sales orders untuk customer ini
              const orders = await SalesOrder.findAll({
                page: 1,
                limit: 100,
                search: customer.name || customer.customerName
              });

              // Jika ada orders, ambil detail dan cek history
              for (const order of orders.orders) {
                try {
                  // Ambil detail sales order dari Accurate
                  const soDetail = await ApiClient.get(userId, '/sales-order/detail.do', { 
                    id: order.soId 
                  });

                  if (soDetail && soDetail.d) {
                    const detail = soDetail.d;
                    
                    // Extract info user yang mengubah
                    const modifiedBy = detail.modifiedBy || detail.createdBy || detail.userName || 'Unknown';
                    const modifiedById = detail.modifiedById || detail.createdById || detail.userId || null;
                    
                    // Cek apakah ada perubahan status
                    if (detail.documentStatus || detail.status) {
                      const status = detail.documentStatus?.name || detail.status;
                      
                      // Simpan history jika status "Sebagian diproses"
                      if (status && status.toLowerCase().includes('sebagian')) {
                        await SalesInvoiceHistory.create({
                          sales_order_id: order.id,
                          so_id: order.soId,
                          invoice_number: detail.number || detail.transNumber,
                          invoice_date: detail.transDate || new Date().toISOString().split('T')[0],
                          action_type: 'status_changed',
                          status: status,
                          modified_by: modifiedBy,
                          modified_by_id: modifiedById,
                          description: `Buat Faktur Penjualan ${detail.number || detail.transNumber} oleh ${modifiedBy}`,
                          accurate_data: detail
                        });

                        totalSynced++;
                      }
                    }
                  }
                } catch (error) {
                  logger.warn('Failed to sync history for order', { 
                    orderId: order.id,
                    error: error.message 
                  });
                  // Continue with next order
                }
              }
            } catch (error) {
              logger.warn('Failed to process customer', { 
                customerId: customer.id,
                error: error.message 
              });
              // Continue with next customer
            }
          }

          page++;

        } catch (error) {
          logger.error('Error syncing invoice history page', { 
            page,
            error: error.message 
          });
          break;
        }
      }

      logger.info('Invoice history sync completed', { totalSynced });

      return {
        success: true,
        synced: totalSynced
      };

    } catch (error) {
      logger.error('Invoice history sync failed', { 
        error: error.message 
      });
      throw new AppError(`Failed to sync invoice history: ${error.message}`, 500);
    }
  }
}

module.exports = CustomerService;
