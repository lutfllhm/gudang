const { query, transaction } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class Item {
  /**
   * Find item by ID
   */
  static async findById(id) {
    const items = await query(
      'SELECT * FROM items WHERE id = ? AND is_active = 1',
      [id]
    );
    return items[0] || null;
  }

  /**
   * Find item by Accurate item_id
   */
  static async findByItemId(itemId) {
    const items = await query(
      'SELECT * FROM items WHERE item_id = ?',
      [itemId]
    );
    return items[0] || null;
  }

  /**
   * Transform database item to API format
   */
  static transformToApi(item) {
    if (!item) return null;
    
    return {
      id: item.id,
      itemId: item.item_id,
      name: item.nama_item,
      no: item.kode_item,
      category: item.kategori,
      unitName: item.satuan,
      availableStock: parseFloat(item.stok_tersedia || 0),
      unitPrice: parseFloat(item.harga_jual || 0),
      avgCost: parseFloat(item.harga_beli || 0),
      description: item.deskripsi,
      lastSync: item.last_sync,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }

  /**
   * Get all items with pagination and filters
   */
  static async findAll({ page = 1, limit = 20, search = '', kategori = null, sortBy = 'kode_item', sortOrder = 'asc' }) {
    // Convert to integers
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['is_active = 1'];
    let params = [];

    if (search) {
      whereConditions.push('(nama_item LIKE ? OR kode_item LIKE ? OR deskripsi LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (kategori) {
      whereConditions.push('kategori = ?');
      params.push(kategori);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Validate sortBy
    const allowedSortFields = ['nama_item', 'kode_item', 'kategori', 'stok_tersedia', 'harga_jual', 'last_sync'];
    if (!allowedSortFields.includes(sortBy)) {
      sortBy = 'nama_item';
    }

    // Validate sortOrder
    sortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM items ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get items - use string interpolation for LIMIT/OFFSET to avoid MySQL2 parameter binding issues
    const items = await query(
      `SELECT * FROM items ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // Transform items to API format
    const transformedItems = items.map(item => this.transformToApi(item));

    return {
      items: transformedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create or update item (upsert)
   */
  static async upsert(data) {
    const {
      item_id,
      nama_item,
      kode_item,
      kategori,
      satuan,
      stok_tersedia,
      harga_jual,
      harga_beli,
      deskripsi
    } = data;

    const existing = await this.findByItemId(item_id);

    if (existing) {
      // Update
      await query(
        `UPDATE items 
         SET nama_item = ?, kode_item = ?, kategori = ?, satuan = ?,
             stok_tersedia = ?, harga_jual = ?, harga_beli = ?, deskripsi = ?,
             last_sync = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE item_id = ?`,
        [nama_item, kode_item, kategori, satuan, stok_tersedia, harga_jual, harga_beli, deskripsi, item_id]
      );

      return await this.findByItemId(item_id);
    } else {
      // Insert
      await query(
        `INSERT INTO items (item_id, nama_item, kode_item, kategori, satuan, stok_tersedia, harga_jual, harga_beli, deskripsi)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item_id, nama_item, kode_item, kategori, satuan, stok_tersedia, harga_jual, harga_beli, deskripsi]
      );

      return await this.findByItemId(item_id);
    }
  }

  /**
   * Bulk upsert items
   */
  static async bulkUpsert(items) {
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const item of items) {
      try {
        const existing = await this.findByItemId(item.item_id);
        if (existing) {
          await this.upsert(item);
          updated++;
        } else {
          await this.upsert(item);
          inserted++;
        }
      } catch (error) {
        logger.error('Error upserting item', { item, error: error.message });
        errors++;
      }
    }

    logger.info('Bulk upsert completed', { inserted, updated, errors, total: items.length });

    return { inserted, updated, errors, total: items.length };
  }

  /**
   * Soft delete item
   */
  static async softDelete(id) {
    const item = await this.findById(id);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    await query(
      'UPDATE items SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    logger.info('Item soft deleted', { itemId: id });

    return true;
  }

  /**
   * Get item statistics
   */
  static async getStats() {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(stok_tersedia) as total_stock,
        COUNT(DISTINCT kategori) as total_categories,
        SUM(CASE WHEN stok_tersedia = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN stok_tersedia > 0 AND stok_tersedia <= 10 THEN 1 ELSE 0 END) as low_stock
      FROM items
      WHERE is_active = 1
    `);

    return stats[0];
  }

  /**
   * Get categories
   */
  static async getCategories() {
    const categories = await query(`
      SELECT DISTINCT kategori, COUNT(*) as count
      FROM items
      WHERE is_active = 1 AND kategori IS NOT NULL
      GROUP BY kategori
      ORDER BY kategori
    `);

    return categories;
  }

  /**
   * Get low stock items
   */
  static async getLowStock(threshold = 10) {
    const items = await query(
      `SELECT * FROM items 
       WHERE is_active = 1 AND stok_tersedia > 0 AND stok_tersedia <= ?
       ORDER BY stok_tersedia ASC
       LIMIT 20`,
      [threshold]
    );

    return items;
  }

  /**
   * Get out of stock items
   */
  static async getOutOfStock() {
    const items = await query(
      `SELECT * FROM items 
       WHERE is_active = 1 AND stok_tersedia = 0
       ORDER BY nama_item
       LIMIT 20`
    );

    return items;
  }

  /**
   * Search items (fulltext search)
   */
  static async search(searchTerm, limit = 20) {
    const items = await query(
      `SELECT *, MATCH(nama_item, kode_item, deskripsi) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
       FROM items
       WHERE is_active = 1 AND MATCH(nama_item, kode_item, deskripsi) AGAINST(? IN NATURAL LANGUAGE MODE)
       ORDER BY relevance DESC
       LIMIT ?`,
      [searchTerm, searchTerm, limit]
    );

    return items;
  }

  /**
   * Update last sync timestamp
   */
  static async updateLastSync() {
    await query('UPDATE sync_config SET last_sync_items = CURRENT_TIMESTAMP WHERE id = 1');
  }
}

module.exports = Item;
