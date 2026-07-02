const admin = require('firebase-admin');
const config = require('../config');
const logger = require('../utils/logger');
const DeviceToken = require('../models/DeviceToken');

class PushNotificationService {
  constructor() {
    this.app = null;
    this._initialized = false;
  }

  /**
   * Lazy-init firebase-admin from base64 service account JSON.
   * No-ops (with a warning) when not configured, so the server can run
   * before a Firebase project is set up.
   */
  _ensureInitialized() {
    if (this._initialized) return;
    this._initialized = true;

    const base64 = config.firebase?.serviceAccountBase64;
    if (!base64) {
      logger.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_BASE64 not set - push notifications disabled');
      return;
    }

    try {
      const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      logger.info('✅ Firebase Admin initialized - push notifications enabled');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin', { error: error.message });
    }
  }

  async _send(tokens, notification, data) {
    this._ensureInitialized();
    if (!this.app || tokens.length === 0) return;

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification,
        data
      });

      const staleTokens = [];
      response.responses.forEach((res, i) => {
        if (!res.success && res.error?.code === 'messaging/registration-token-not-registered') {
          staleTokens.push(tokens[i]);
        }
      });
      await Promise.all(staleTokens.map((t) => DeviceToken.deleteByToken(t)));

      logger.info('Push notification sent', {
        success: response.successCount,
        failure: response.failureCount
      });
    } catch (error) {
      logger.error('Failed to send push notification', { error: error.message });
    }
  }

  /**
   * Push saat SO baru masuk.
   */
  async sendNewSalesOrderPush(salesOrder) {
    const tokens = await DeviceToken.findAllTokens();
    const soNumber = salesOrder?.nomor_so || salesOrder?.transNumber || '';
    const customer = salesOrder?.nama_pelanggan || salesOrder?.customerName || '';

    await this._send(
      tokens,
      { title: 'SO Baru', body: `${soNumber} · ${customer}` },
      { type: 'sales_order_new', so_id: String(salesOrder?.so_id ?? salesOrder?.id ?? '') }
    );
  }

  /**
   * Push reminder untuk SO yang belum diproses > 3 hari.
   */
  async sendOverdueReminderPush(orders) {
    if (!orders || orders.length === 0) return;
    const tokens = await DeviceToken.findAllTokens();

    await this._send(
      tokens,
      { title: 'Peringatan Overdue', body: `${orders.length} SO belum diproses > 3 hari` },
      { type: 'sales_order_overdue', count: String(orders.length) }
    );
  }
}

module.exports = new PushNotificationService();
