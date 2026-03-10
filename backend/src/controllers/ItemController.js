const ItemService = require('../services/ItemService');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

class ItemController {
  static getAll = asyncHandler(async (req, res) => {
    const { page, limit, search, kategori, sortBy, sortOrder } = req.query;

    const result = await ItemService.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
      kategori,
      sortBy,
      sortOrder
    });

    paginated(res, result.items, result.pagination);
  });

  static getById = asyncHandler(async (req, res) => {
    const item = await ItemService.getById(req.params.id);
    success(res, item);
  });

  static search = asyncHandler(async (req, res) => {
    const { q, limit } = req.query;
    const items = await ItemService.search(q, parseInt(limit) || 20);
    success(res, items);
  });

  static getStats = asyncHandler(async (req, res) => {
    const stats = await ItemService.getStats();
    success(res, stats);
  });

  static getCategories = asyncHandler(async (req, res) => {
    const categories = await ItemService.getCategories();
    success(res, categories);
  });

  static getLowStock = asyncHandler(async (req, res) => {
    const { threshold } = req.query;
    const items = await ItemService.getLowStock(parseInt(threshold) || 10);
    success(res, items);
  });

  static getOutOfStock = asyncHandler(async (req, res) => {
    const items = await ItemService.getOutOfStock();
    success(res, items);
  });

  static syncFromAccurate = asyncHandler(async (req, res) => {
    const { pageSize, forceFullSync } = req.body;

    const result = await ItemService.syncFromAccurate(req.user.id, {
      pageSize: parseInt(pageSize) || 100,
      forceFullSync: forceFullSync === true
    });

    success(res, result, 'Items synced successfully');
  });
}

module.exports = ItemController;
