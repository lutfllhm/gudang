const AuthService = require('../services/AuthService');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, created } = require('../utils/response');
const { validationMiddleware, schemas } = require('../utils/validator');

class AuthController {
  /**
   * Login
   */
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    const result = await AuthService.login(email, password, ipAddress);

    success(res, result, 'Login successful');
  });

  /**
   * Register (admin only)
   */
  static register = asyncHandler(async (req, res) => {
    const user = await AuthService.register(req.body, req.user.id);

    created(res, user, 'User registered successfully');
  });

  /**
   * Refresh token
   */
  static refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const result = await AuthService.refreshAccessToken(refreshToken);

    success(res, result, 'Token refreshed successfully');
  });

  /**
   * Get profile
   */
  static getProfile = asyncHandler(async (req, res) => {
    const user = await AuthService.getProfile(req.user.id);

    success(res, user);
  });

  /**
   * Update profile
   */
  static updateProfile = asyncHandler(async (req, res) => {
    const user = await AuthService.updateProfile(req.user.id, req.body);

    success(res, user, 'Profile updated successfully');
  });

  /**
   * Change password
   */
  static changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    await AuthService.changePassword(req.user.id, oldPassword, newPassword);

    success(res, null, 'Password changed successfully');
  });

  /**
   * Get activity logs
   */
  static getActivityLogs = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    const result = await AuthService.getActivityLogs(req.user.id, { page, limit });

    success(res, result);
  });

  /**
   * Logout
   */
  static logout = asyncHandler(async (req, res) => {
    // Log activity
    await AuthService.logActivity(req.user.id, 'logout', 'User logged out', req.ip);

    success(res, null, 'Logout successful');
  });
}

module.exports = AuthController;
