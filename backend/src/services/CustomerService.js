const ApiClient = require('./accurate/ApiClient');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

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
}

module.exports = CustomerService;
