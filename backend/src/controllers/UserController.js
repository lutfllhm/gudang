const User = require('../models/User');
const AuthService = require('../services/AuthService');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, created, paginated, noContent } = require('../utils/response');

class UserController {
  static getAll = asyncHandler(async (req, res) => {
    const { page, limit, search, role, status } = req.query;

    const result = await User.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
      role,
      status
    });

    paginated(res, result.users, result.pagination);
  });

  static getById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    success(res, user);
  });

  static create = asyncHandler(async (req, res) => {
    const user = await AuthService.register(req.body, req.user.id);
    created(res, user, 'User created successfully');
  });

  static update = asyncHandler(async (req, res) => {
    const user = await User.update(req.params.id, req.body);
    
    // Log activity
    await AuthService.logActivity(
      req.user.id,
      'update_user',
      `Updated user: ${user.email}`
    );

    success(res, user, 'User updated successfully');
  });

  static delete = asyncHandler(async (req, res) => {
    await User.delete(req.params.id);
    
    // Log activity
    await AuthService.logActivity(
      req.user.id,
      'delete_user',
      `Deleted user ID: ${req.params.id}`
    );

    noContent(res);
  });

  static getStats = asyncHandler(async (req, res) => {
    const stats = await User.getStats();
    success(res, stats);
  });
}

module.exports = UserController;
