const { Server } = require('socket.io');
const logger = require('../utils/logger');
const config = require('../config');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: config.cors.credentials,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    logger.info('✅ WebSocket service initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });
      this.connectedClients.set(socket.id, {
        connectedAt: new Date(),
        userId: null
      });

      // Handle authentication
      socket.on('authenticate', (data) => {
        const clientInfo = this.connectedClients.get(socket.id);
        if (clientInfo) {
          clientInfo.userId = data.userId;
          this.connectedClients.set(socket.id, clientInfo);
          logger.info('Client authenticated', { socketId: socket.id, userId: data.userId });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
        this.connectedClients.delete(socket.id);
      });

      // Send initial connection success
      socket.emit('connected', {
        message: 'Connected to iWare Warehouse',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Broadcast new sales order to all clients
   */
  broadcastNewSalesOrder(salesOrder) {
    if (!this.io) return;
    
    logger.info('Broadcasting new sales order', { soId: salesOrder.so_id });
    this.io.emit('sales_order:new', {
      type: 'sales_order_created',
      data: salesOrder,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast updated sales order to all clients
   */
  broadcastUpdatedSalesOrder(salesOrder) {
    if (!this.io) return;
    
    logger.info('Broadcasting updated sales order', { soId: salesOrder.so_id });
    this.io.emit('sales_order:updated', {
      type: 'sales_order_updated',
      data: salesOrder,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast deleted sales order to all clients
   */
  broadcastDeletedSalesOrder(soId) {
    if (!this.io) return;
    
    logger.info('Broadcasting deleted sales order', { soId });
    this.io.emit('sales_order:deleted', {
      type: 'sales_order_deleted',
      data: { so_id: soId },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast new item to all clients
   */
  broadcastNewItem(item) {
    if (!this.io) return;
    
    logger.info('Broadcasting new item', { itemId: item.item_id });
    this.io.emit('item:new', {
      type: 'item_created',
      data: item,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast updated item to all clients
   */
  broadcastUpdatedItem(item) {
    if (!this.io) return;
    
    logger.info('Broadcasting updated item', { itemId: item.item_id });
    this.io.emit('item:updated', {
      type: 'item_updated',
      data: item,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast sync status to all clients
   */
  broadcastSyncStatus(status) {
    if (!this.io) return;
    
    this.io.emit('sync:status', {
      type: 'sync_status',
      data: status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Close WebSocket server
   */
  close() {
    if (this.io) {
      this.io.close();
      logger.info('WebSocket service closed');
    }
  }
}

module.exports = new WebSocketService();
