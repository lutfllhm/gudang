const Item = require('../models/Item');
const ApiClient = require('./accurate/ApiClient');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { query } = require('../config/database');

class ItemService {
  /**
   * Get all items with pagination
   */
  static async getAll(filters) {
    return await Item.findAll(filters);
  }

  /**
   * Get item by ID
   */
  static async getById(id) {
    const item = await Item.findById(id);
    
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    return item;
  }

  /**
   * Search items
   */
  static async search(searchTerm, limit = 20) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    return await Item.search(searchTerm, limit);
  }

  /**
   * Get item statistics
   */
  static async getStats() {
    return await Item.getStats();
  }

  /**
   * Get categories
   */
  static async getCategories() {
    return await Item.getCategories();
  }

  /**
   * Get low stock items
   */
  static async getLowStock(threshold = 10) {
    return await Item.getLowStock(threshold);
  }

  /**
   * Get out of stock items
   */
  static async getOutOfStock() {
    return await Item.getOutOfStock();
  }

  /**
   * Sync items from Accurate Online
   */
  static async syncFromAccurate(userId, options = {}) {
    const {
      pageSize = 100,
      forceFullSync = false
    } = options;

    try {
      logger.info('Starting items sync from Accurate', { userId, options });

      // Create sync log
      const syncLogResult = await query(
        'INSERT INTO sync_logs (sync_type, status, started_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        ['items', 'started']
      );
      const syncLogId = syncLogResult.insertId;

      let totalSynced = 0;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          // Get items list from Accurate (only IDs)
          const response = await ApiClient.get(userId, '/item/list.do', {
            'sp.page': page,
            'sp.pageSize': pageSize
          });

          if (!response || !response.d) {
            logger.warn('No data returned from Accurate API', { page });
            break;
          }

          const items = Array.isArray(response.d) ? response.d : [];

          if (items.length === 0) {
            hasMore = false;
            break;
          }

          // Fetch details for each item (with rate limiting handled by ApiClient)
          const detailedItems = [];
          for (const item of items) {
            try {
              const detailResponse = await ApiClient.get(userId, '/item/detail.do', { id: item.id });
              if (detailResponse && detailResponse.d) {
                detailedItems.push(detailResponse.d);
              }
            } catch (error) {
              logger.warn('Failed to get item detail', { itemId: item.id, error: error.message });
              // Continue with next item even if one fails
            }
          }

          if (detailedItems.length === 0) {
            logger.warn('No detailed items retrieved', { page });
            page++;
            continue;
          }

          // Transform and upsert items
          const transformedItems = detailedItems.map(item => this.transformAccurateItem(item));
          const result = await Item.bulkUpsert(transformedItems);

          totalSynced += result.inserted + result.updated;

          logger.info('Items page synced', { 
            page, 
            count: detailedItems.length, 
            inserted: result.inserted, 
            updated: result.updated 
          });

          // Check if there are more pages
          if (items.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }

        } catch (error) {
          logger.error('Error syncing items page', { page, error: error.message });
          
          // Update sync log with error
          await query(
            'UPDATE sync_logs SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['failed', error.message, syncLogId]
          );

          throw error;
        }
      }

      // Update last sync timestamp
      await Item.updateLastSync();

      // Update sync log
      const duration = await this.calculateSyncDuration(syncLogId);
      await query(
        'UPDATE sync_logs SET status = ?, records_synced = ?, completed_at = CURRENT_TIMESTAMP, duration_seconds = ? WHERE id = ?',
        ['success', totalSynced, duration, syncLogId]
      );

      logger.info('Items sync completed', { totalSynced, duration });

      return {
        success: true,
        totalSynced,
        duration
      };

    } catch (error) {
      logger.error('Items sync failed', { error: error.message });
      // Preserve underlying operational errors (e.g. 401 token expired / not connected)
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to sync items from Accurate', 500);
    }
  }

  /**
   * Transform Accurate item to our format
   */
  static transformAccurateItem(accurateItem) {
    return {
      item_id: String(accurateItem.id || accurateItem.itemId),
      nama_item: accurateItem.name || accurateItem.itemName || '',
      kode_item: accurateItem.no || accurateItem.itemNo || '',
      kategori: accurateItem.itemCategoryName || null,
      satuan: accurateItem.unitName || null,
      stok_tersedia: parseFloat(accurateItem.availableQty || 0),
      harga_jual: parseFloat(accurateItem.unitPrice || 0),
      harga_beli: parseFloat(accurateItem.avgCost || 0),
      deskripsi: accurateItem.description || null
    };
  }

  /**
   * Get item from Accurate by ID
   */
  static async getFromAccurate(userId, itemId) {
    try {
      const response = await ApiClient.get(userId, '/item/detail.do', { id: itemId });

      if (!response || !response.d) {
        throw new AppError('Item not found in Accurate', 404);
      }

      return this.transformAccurateItem(response.d);
    } catch (error) {
      logger.error('Error getting item from Accurate', { itemId, error: error.message });
      throw new AppError('Failed to get item from Accurate', 500);
    }
  }

  /**
   * Get item stock from Accurate
   */
  static async getStockFromAccurate(userId, itemId) {
    try {
      const response = await ApiClient.get(userId, '/item/get-stock.do', { id: itemId });

      if (!response || !response.d) {
        throw new AppError('Stock not found in Accurate', 404);
      }

      return response.d;
    } catch (error) {
      logger.error('Error getting stock from Accurate', { itemId, error: error.message });
      throw new AppError('Failed to get stock from Accurate', 500);
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
   * Sync single item from Accurate (untuk webhook)
   */
  static async syncSingleItem(itemId) {
    try {
      logger.info('Syncing single item from Accurate', { itemId });

      // Get user ID (ambil user pertama yang punya token)
      const userResult = await query(
        'SELECT id FROM users WHERE accurate_access_token IS NOT NULL LIMIT 1'
      );

      if (userResult.length === 0) {
        throw new AppError('No user with Accurate token found', 404);
      }

      const userId = userResult[0].id;

      // Get item from Accurate
      const accurateItem = await this.getFromAccurate(userId, itemId);

      // Upsert item
      const result = await Item.bulkUpsert([accurateItem]);

      logger.info('Single item synced', { 
        itemId, 
        inserted: result.inserted, 
        updated: result.updated 
      });

      return {
        success: true,
        itemId,
        action: result.inserted > 0 ? 'inserted' : 'updated'
      };

    } catch (error) {
      logger.error('Failed to sync single item', { itemId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete item (untuk webhook)
   */
  static async deleteItem(itemId) {
    try {
      logger.info('Deleting item', { itemId });

      const result = await query(
        'DELETE FROM items WHERE item_id = ?',
        [String(itemId)]
      );

      logger.info('Item deleted', { itemId, affectedRows: result.affectedRows });

      return {
        success: true,
        itemId,
        deleted: result.affectedRows > 0
      };

    } catch (error) {
      logger.error('Failed to delete item', { itemId, error: error.message });
      throw error;
    }
  }
}

module.exports = ItemService;
