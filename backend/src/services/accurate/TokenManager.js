const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config');
const logger = require('../../utils/logger');
const { query, transaction } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

class TokenManager {
  constructor() {
    this.accountUrl = config.accurate.accountUrl;
    this.signatureSecret = config.accurate.signatureSecret;
    this.tokenCache = new Map(); // In-memory cache
  }

  /**
   * Generate timestamp for API
   * Format: dd/MM/yyyy HH:mm:ss (sesuai dokumentasi Accurate Online API)
   * Timezone: Server timezone (akan di-convert otomatis oleh Accurate)
   */
  generateTimestamp() {
    const now = new Date();
    
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Generate HMAC SHA-256 signature
   * Sesuai dokumentasi Accurate Online API:
   * - Algorithm: HMAC SHA-256
   * - Input: timestamp string
   * - Secret: signature secret dari Developer Portal
   * - Output: hex string (lowercase)
   */
  generateSignature(timestamp) {
    const hmac = crypto.createHmac('sha256', this.signatureSecret);
    hmac.update(timestamp);
    return hmac.digest('hex');
  }

  /**
   * Save token to database
   */
  async saveToken(userId, tokenData) {
    try {
      await transaction(async (conn) => {
        // Deactivate old tokens
        await conn.execute(
          'UPDATE accurate_tokens SET is_active = 0 WHERE user_id = ? AND is_active = 1',
          [userId]
        );

        // Calculate expires_at
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

        // Insert new token
        await conn.execute(
          `INSERT INTO accurate_tokens 
           (user_id, access_token, refresh_token, token_type, expires_in, expires_at, scope, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            userId,
            tokenData.access_token,
            tokenData.refresh_token,
            tokenData.token_type || 'Bearer',
            tokenData.expires_in || 3600,
            expiresAt,
            tokenData.scope || ''
          ]
        );
      });

      // Clear cache for this user
      this.tokenCache.delete(userId);

      logger.info('Token saved successfully', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Error saving token:', error);
      throw new AppError('Failed to save token', 500);
    }
  }

  /**
   * Get active token for user
   */
  async getActiveToken(userId) {
    try {
      // Check cache first
      const cached = this.tokenCache.get(userId);
      if (cached && new Date(cached.expiresAt) > new Date()) {
        logger.info('Token retrieved from cache', { userId });
        return { success: true, token: cached };
      }

      // Get from database
      const tokens = await query(
        `SELECT * FROM accurate_tokens 
         WHERE user_id = ? AND is_active = 1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      if (tokens.length === 0) {
        return {
          success: false,
          message: 'No active token found. Please connect to Accurate Online.'
        };
      }

      const token = tokens[0];
      const now = new Date();
      const expiresAt = new Date(token.expires_at);

      // Check if token is expired
      if (now >= expiresAt) {
        logger.warn('Token expired, attempting refresh', { userId });
        
        // Try to refresh token
        const refreshResult = await this.refreshToken(userId, token.refresh_token);
        
        if (refreshResult.success) {
          return await this.getActiveToken(userId); // Get new token
        }

        return {
          success: false,
          message: 'Token expired. Please reconnect to Accurate Online.',
          needsReconnect: true
        };
      }

      // Cache token
      const tokenData = {
        id: token.id,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenType: token.token_type,
        expiresAt: token.expires_at,
        scope: token.scope
      };

      this.tokenCache.set(userId, tokenData);

      logger.info('Token retrieved from database', { userId });

      return { success: true, token: tokenData };
    } catch (error) {
      logger.error('Error getting active token:', error);
      throw new AppError('Failed to get token', 500);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(userId, refreshToken) {
    try {
      logger.info('Refreshing token', { userId });

      const basicAuth = Buffer
        .from(`${config.accurate.clientId}:${config.accurate.clientSecret}`)
        .toString('base64');

      const response = await axios.post(
        `${this.accountUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`
          },
          timeout: 20000
        }
      );

      const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;

      // Save new token
      await this.saveToken(userId, {
        access_token,
        refresh_token: new_refresh_token || refreshToken,
        expires_in
      });

      logger.info('Token refreshed successfully', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      
      // If refresh fails, mark token as inactive
      await query(
        'UPDATE accurate_tokens SET is_active = 0 WHERE user_id = ?',
        [userId]
      );

      this.tokenCache.delete(userId);

      return {
        success: false,
        message: 'Failed to refresh token. Please reconnect to Accurate Online.'
      };
    }
  }

  /**
   * Revoke token (logout)
   */
  async revokeToken(userId) {
    try {
      await query(
        'UPDATE accurate_tokens SET is_active = 0 WHERE user_id = ?',
        [userId]
      );

      this.tokenCache.delete(userId);

      logger.info('Token revoked', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Error revoking token:', error);
      throw new AppError('Failed to revoke token', 500);
    }
  }

  /**
   * Check if user has active token
   */
  async hasActiveToken(userId) {
    try {
      const result = await this.getActiveToken(userId);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup expired tokens (for cron job)
   */
  async cleanupExpiredTokens() {
    try {
      const result = await query(
        'UPDATE accurate_tokens SET is_active = 0 WHERE expires_at < NOW() AND is_active = 1'
      );

      logger.info('Expired tokens cleaned up', { count: result.affectedRows });

      return { success: true, count: result.affectedRows };
    } catch (error) {
      logger.error('Error cleaning up expired tokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear token cache
   */
  clearCache(userId = null) {
    if (userId) {
      this.tokenCache.delete(userId);
    } else {
      this.tokenCache.clear();
    }
  }
}

module.exports = new TokenManager();
