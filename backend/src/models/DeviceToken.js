const { query } = require('../config/database');
const logger = require('../utils/logger');

class DeviceToken {
  /**
   * Register or refresh a device token for a user
   */
  static async upsert({ userId, fcmToken, platform = 'android' }) {
    await query(
      `INSERT INTO device_tokens (user_id, fcm_token, platform, last_active_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform), last_active_at = CURRENT_TIMESTAMP`,
      [userId, fcmToken, platform]
    );

    logger.info('Device token registered', { userId, platform });
  }

  /**
   * Get all registered FCM tokens (for broadcast push)
   */
  static async findAllTokens() {
    const rows = await query('SELECT fcm_token FROM device_tokens');
    return Array.isArray(rows) ? rows.map((r) => r.fcm_token) : [];
  }

  /**
   * Remove a token (e.g. reported as stale/invalid by FCM)
   */
  static async deleteByToken(fcmToken) {
    await query('DELETE FROM device_tokens WHERE fcm_token = ?', [fcmToken]);
    logger.info('Device token removed', { fcmToken: fcmToken?.slice(0, 12) + '...' });
  }
}

module.exports = DeviceToken;
