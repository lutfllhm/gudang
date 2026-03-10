const ItemService = require('../services/ItemService');
const SalesOrderService = require('../services/SalesOrderService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class WebhookController {
  /**
   * Handle webhook dari Accurate Online
   * Endpoint: POST /api/accurate/webhook
   */
  static handleWebhook = asyncHandler(async (req, res) => {
    const { event, data } = req.body;
    
    logger.info('Webhook received from Accurate', { 
      event, 
      dataId: data?.id,
      timestamp: new Date().toISOString()
    });

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
