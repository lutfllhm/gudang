const { query } = require('../config/database');
const logger = require('../utils/logger');
const PushNotificationService = require('./PushNotificationService');

const OVERDUE_DAYS = 3;

// Sama seperti STATUS_GROUP.pending di frontend/src/pages/SchedulePage.jsx
const PENDING_STATUS_PATTERNS = [
  'menunggu diproses',
  'menunggu proses',
  'pending',
  'belum terproses',
  'dipesan',
  'queue',
  'waiting',
  'open',
  'new',
  'draft'
];

class OverdueReminderService {
  /**
   * Cek SO berstatus "Menunggu diproses" yang sudah lewat OVERDUE_DAYS hari,
   * lalu kirim push notification jika ada. Dipanggil oleh cron di server.js
   * pada jam-jam reminder (mirip REMINDER_TIMES_WIB di web).
   */
  async checkAndNotify() {
    try {
      const likeConditions = PENDING_STATUS_PATTERNS.map(() => 'LOWER(status) LIKE ?').join(' OR ');
      const likeParams = PENDING_STATUS_PATTERNS.map((p) => `%${p}%`);

      const orders = await query(
        `SELECT so_id, nomor_so, nama_pelanggan, tanggal_so, status
         FROM sales_orders
         WHERE is_active = TRUE
           AND (${likeConditions})
           AND tanggal_so <= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        [...likeParams, OVERDUE_DAYS]
      );

      if (!orders || orders.length === 0) {
        logger.info('[OverdueReminder] Tidak ada SO overdue');
        return;
      }

      logger.info(`[OverdueReminder] Ditemukan ${orders.length} SO overdue >= ${OVERDUE_DAYS} hari`);
      await PushNotificationService.sendOverdueReminderPush(orders);
    } catch (error) {
      logger.error('[OverdueReminder] Gagal cek SO overdue', { error: error.message });
    }
  }
}

module.exports = new OverdueReminderService();
