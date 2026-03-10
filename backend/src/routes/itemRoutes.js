const express = require('express');
const router = express.Router();
const ItemController = require('../controllers/ItemController');
const { authenticate } = require('../middleware/auth');
const { syncLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(authenticate);

router.get('/', ItemController.getAll);
router.get('/stats', ItemController.getStats);
router.get('/categories', ItemController.getCategories);
router.get('/low-stock', ItemController.getLowStock);
router.get('/out-of-stock', ItemController.getOutOfStock);
router.get('/search', ItemController.search);
router.get('/:id', ItemController.getById);

// Sync routes
router.post('/sync', syncLimiter, ItemController.syncFromAccurate);

module.exports = router;
