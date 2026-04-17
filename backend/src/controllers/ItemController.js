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

  static debugAccurateItem = asyncHandler(async (req, res) => {
    const { id } = req.query;
    const ApiClient = require('../services/accurate/ApiClient');

    // Ambil 1 item dari list untuk melihat struktur response
    const listResp = await ApiClient.get(req.user.id, '/item/list.do', {
      'sp.page': 1,
      'sp.pageSize': 1,
      fields: 'id,no,name,unitName,availableQty,availableQuantity,onHand,qtyOnHand,unitPrice,avgCost'
    });

    const itemId = id || listResp?.d?.[0]?.id;
    let detailResp = null;
    let stockResp = null;

    if (itemId) {
      detailResp = await ApiClient.get(req.user.id, '/item/detail.do', { id: itemId });
      try {
        stockResp = await ApiClient.get(req.user.id, '/item/get-stock.do', { id: itemId });
      } catch (e) {
        stockResp = { error: e.message };
      }
    }

    success(res, {
      listSample: listResp?.d?.[0] || null,
      detailSample: detailResp?.d || null,
      stockSample: stockResp?.d || stockResp || null
    }, 'Debug info');
  });
}

module.exports = ItemController;
