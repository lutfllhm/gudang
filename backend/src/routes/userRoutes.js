const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticate, authorize } = require('../middleware/auth');
const { validationMiddleware, schemas } = require('../utils/validator');

// All routes require authentication
router.use(authenticate);

// Get all users (admin & superadmin only)
router.get('/', authorize('admin', 'superadmin'), UserController.getAll);

// Get user stats (must be before /:id to avoid matching "stats" as id)
router.get('/stats/summary',
  authorize('superadmin'),
  UserController.getStats
);

// Get user by ID
router.get('/:id', UserController.getById);

// Create user (superadmin only)
router.post('/',
  authorize('superadmin'),
  validationMiddleware(schemas.createUser),
  UserController.create
);

// Update user (superadmin only)
router.put('/:id',
  authorize('superadmin'),
  validationMiddleware(schemas.updateUser),
  UserController.update
);

// Delete user (superadmin only)
router.delete('/:id',
  authorize('superadmin'),
  UserController.delete
);

module.exports = router;
