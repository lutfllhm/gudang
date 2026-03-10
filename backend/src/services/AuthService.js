const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { query } = require('../config/database');

class AuthService {
  /**
   * Login user
   */
  static async login(email, password, ipAddress = null) {
    // Find user
    const user = await User.findByEmail(email);
    
    if (!user) {
      logger.warn('Login attempt with invalid email', { email, ipAddress });
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (user.status !== 'aktif') {
      logger.warn('Login attempt for inactive user', { email, ipAddress });
      throw new AppError('Account is inactive', 403);
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email, ipAddress });
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Log activity
    await this.logActivity(user.id, 'login', 'User logged in', ipAddress);

    logger.info('User logged in successfully', { userId: user.id, email });

    return {
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        foto_profil: user.foto_profil
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Register new user (admin only)
   */
  static async register(data, createdBy = null) {
    const user = await User.create(data);

    // Log activity
    if (createdBy) {
      await this.logActivity(createdBy, 'create_user', `Created user: ${user.email}`);
    }

    logger.info('User registered', { userId: user.id, email: user.email });

    return user;
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      // Get user
      const user = await User.findById(decoded.userId);
      
      if (!user || user.status !== 'aktif') {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      logger.info('Access token refreshed', { userId: user.id });

      return { accessToken };
    } catch (error) {
      logger.error('Refresh token error', { error: error.message });
      throw new AppError('Invalid refresh token', 401);
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, data) {
    const user = await User.update(userId, data);

    // Log activity
    await this.logActivity(userId, 'update_profile', 'Updated profile');

    logger.info('Profile updated', { userId });

    return user;
  }

  /**
   * Change password
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user with password
    const userWithPassword = await User.findByEmail(user.email);

    // Verify old password
    const isValidPassword = await User.verifyPassword(oldPassword, userWithPassword.password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid old password', 401);
    }

    // Update password
    await User.update(userId, { password: newPassword });

    // Log activity
    await this.logActivity(userId, 'change_password', 'Changed password');

    logger.info('Password changed', { userId });

    return true;
  }

  /**
   * Generate access token
   */
  static generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpire }
    );
  }

  /**
   * Log user activity
   */
  static async logActivity(userId, aktivitas, deskripsi = null, ipAddress = null, userAgent = null) {
    try {
      await query(
        'INSERT INTO activity_logs (user_id, aktivitas, deskripsi, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [userId, aktivitas, deskripsi, ipAddress, userAgent]
      );
    } catch (error) {
      logger.error('Error logging activity', { error: error.message });
    }
  }

  /**
   * Get user activity logs
   */
  static async getActivityLogs(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    const logs = await query(
      `SELECT * FROM activity_logs 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = AuthService;
