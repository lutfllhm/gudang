const ItemService = require('../services/ItemService');
const SalesOrderService = require('../services/SalesOrderService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const config = require('../config');
const { query } = require('../config/database');

class WebhookController {
  /**
   * Handle webhook dari Accurate Online
   * Endpoint: POST /api/accurate/webhook
   */
  static handleWebhook = asyncHandler(async (req, res) => {
    const { event, data } = req.body;

    // Optional: simple shared-secret auth (recommended for public webhook endpoint).
    // If WEBHOOK_SECRET is set, Accurate must send `x-webhook-secret` header.
    const expectedSecret = config.webhook?.secret;
    if (expectedSecret) {
      const providedSecret =
        req.headers['x-webhook-secret'] ||
        req.headers['x-webhook-token'] ||
        req.query?.secret;
      if (!providedSecret || String(providedSecret) !== String(expectedSecret)) {
        logger.warn('Webhook rejected: invalid secret', {
          event,
          dataId: data?.id
        });
        // Return 200 to avoid provider retries (but do not process).
        return res.status(200).json({
          success: false,
          message: 'Webhook rejected'
        });
      }
    }
    
    logger.info('Webhook received from Accurate', { 
      event, 
      dataId: data?.id,
      timestamp: new Date().toISOString()
    });

    // Store webhook log for audit/debugging (do not fail processing on logging issues)
    let webhookLogId = null;
    try {
      const payload = JSON.stringify(req.body ?? {});
      const insertResult = await query(
        'INSERT INTO webhook_logs (event_type, payload, processed, received_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [String(event || 'unknown'), payload, false]
      );
      webhookLogId = insertResult.insertId;
    } catch (logError) {
      logger.warn('Failed to write webhook log', { error: logError.message });
    }

    try {
      // Handle berdasarkan event type
      switch (event) {
        case 'item.created':
        case 'item.updated':
          await WebhookController.handleItemEvent(data);
          break;
          
        case 'item.deleted':
          await WebhookController.handleItemDeleted(data);
          break;
          
        case 'sales_order.created':
        case 'sales_order.updated':
          await WebhookController.handleSalesOrderEvent(data);
          break;
          
        case 'sales_order.deleted':
          await WebhookController.handleSalesOrderDeleted(data);
          break;
          
        default:
          logger.warn('Unknown webhook event', { event });
      }

      // Mark webhook log processed
      if (webhookLogId) {
        try {
          await query(
            'UPDATE webhook_logs SET processed = 1, processed_at = CURRENT_TIMESTAMP, error_message = NULL WHERE id = ?',
            [webhookLogId]
          );
        } catch (logError) {
          logger.warn('Failed to update webhook log as processed', { webhookLogId, error: logError.message });
        }
      }

      // Response sukses ke Accurate
      res.status(200).json({
        success: true,
        message: 'Webhook processed',
        event
      });
      
    } catch (error) {
      logger.error('Webhook processing error', { 
        event, 
        error: error.message 
      });

      // Mark webhook log failed
      if (webhookLogId) {
        try {
          await query(
            'UPDATE webhook_logs SET processed = 0, processed_at = CURRENT_TIMESTAMP, error_message = ? WHERE id = ?',
            [error.message, webhookLogId]
          );
        } catch (logError) {
          logger.warn('Failed to update webhook log as failed', { webhookLogId, error: logError.message });
        }
      }
      
      // Tetap return 200 agar Accurate tidak retry terus
      res.status(200).json({
        success: false,
        message: 'Webhook received but processing failed',
        error: error.message
      });
    }
  });

  /**
   * Handle item created/updated
   */
  static async handleItemEvent(data) {
    try {
      // Sync item spesifik dari Accurate
      await ItemService.syncSingleItem(data.id);
      logger.info('Item synced from webhook', { itemId: data.id });
    } catch (error) {
      logger.error('Failed to sync item from webhook', { 
        itemId: data.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Handle item deleted
   */
  static async handleItemDeleted(data) {
    try {
      await ItemService.deleteItem(data.id);
      logger.info('Item deleted from webhook', { itemId: data.id });
    } catch (error) {
      logger.error('Failed to delete item from webhook', { 
        itemId: data.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Handle sales order created/updated
   */
  static async handleSalesOrderEvent(data) {
    try {
      // Sync sales order spesifik dari Accurate
      await SalesOrderService.syncSingleOrder(data.id);
      logger.info('Sales order synced from webhook', { orderId: data.id });
    } catch (error) {
      logger.error('Failed to sync sales order from webhook', { 
        orderId: data.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Handle sales order deleted
   */
  static async handleSalesOrderDeleted(data) {
    try {
      await SalesOrderService.deleteOrder(data.id);
      logger.info('Sales order deleted from webhook', { orderId: data.id });
    } catch (error) {
      logger.error('Failed to delete sales order from webhook', { 
        orderId: data.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Test webhook endpoint
   */
  static testWebhook = asyncHandler(async (req, res) => {
    logger.info('Webhook test received', { body: req.body });
    
    res.json({
      success: true,
      message: 'Webhook endpoint is working',
      received: req.body,
      timestamp: new Date().toISOString()
    });
  });
}

module.exports = WebhookController;
