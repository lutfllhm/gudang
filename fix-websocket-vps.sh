#!/bin/bash

# ============================================
# Script untuk memperbaiki WebSocket di VPS
# ============================================

echo "🔧 Memulai perbaikan WebSocket di VPS..."
echo ""

# 1. Backup file yang akan diubah
echo "📦 Backup file penting..."
cd /root/werehousegudang
cp frontend/src/hooks/useWebSocket.js frontend/src/hooks/useWebSocket.js.backup
cp backend/src/services/WebSocketService.js backend/src/services/WebSocketService.js.backup
cp docker-compose.yml docker-compose.yml.backup
echo "✅ Backup selesai"
echo ""

# 2. Update useWebSocket.js - Kurangi reconnection attempts dan tambah delay
echo "🔧 Memperbaiki frontend WebSocket hook..."
cat > frontend/src/hooks/useWebSocket.js << 'EOF'
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const useWebSocket = (options = {}) => {
  const {
    onSalesOrderNew,
    onSalesOrderUpdated,
    onSalesOrderDeleted,
    onItemNew,
    onItemUpdated,
    onSyncStatus,
    autoConnect = true
  } = options;

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Initialize socket connection with better reconnection strategy
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 20000,
      forceNew: false,
      multiplex: true
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setError(null);

      // Authenticate if user data is available
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          socket.emit('authenticate', { userId: user.id });
        } catch (err) {
          console.error('Failed to parse user data:', err);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setError(err.message);
    });

    socket.on('connected', (data) => {
      console.log('WebSocket server message:', data.message);
    });

    // Sales Order events
    socket.on('sales_order:new', (event) => {
      console.log('📦 New sales order received:', event.data);
      if (onSalesOrderNew) {
        onSalesOrderNew(event.data);
      }
    });

    socket.on('sales_order:updated', (event) => {
      console.log('📝 Sales order updated:', event.data);
      if (onSalesOrderUpdated) {
        onSalesOrderUpdated(event.data);
      }
    });

    socket.on('sales_order:deleted', (event) => {
      console.log('🗑️ Sales order deleted:', event.data);
      if (onSalesOrderDeleted) {
        onSalesOrderDeleted(event.data);
      }
    });

    // Item events
    socket.on('item:new', (event) => {
      console.log('📦 New item received:', event.data);
      if (onItemNew) {
        onItemNew(event.data);
      }
    });

    socket.on('item:updated', (event) => {
      console.log('📝 Item updated:', event.data);
      if (onItemUpdated) {
        onItemUpdated(event.data);
      }
    });

    // Sync status events
    socket.on('sync:status', (event) => {
      console.log('🔄 Sync status:', event.data);
      if (onSyncStatus) {
        onSyncStatus(event.data);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [autoConnect, onSalesOrderNew, onSalesOrderUpdated, onSalesOrderDeleted, onItemNew, onItemUpdated, onSyncStatus]);

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    disconnect,
    reconnect
  };
};
EOF
echo "✅ Frontend WebSocket hook diperbaiki"
echo ""

# 3. Update WebSocketService.js - Tambah ping/pong untuk keep-alive
echo "🔧 Memperbaiki backend WebSocket service..."
cat > backend/src/services/WebSocketService.js << 'EOF'
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
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6,
      allowEIO3: true
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

      // Handle ping/pong for keep-alive
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        logger.info('Client disconnected', { socketId: socket.id, reason });
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
EOF
echo "✅ Backend WebSocket service diperbaiki"
echo ""

# 4. Rebuild dan restart containers
echo "🔄 Rebuild dan restart Docker containers..."
docker-compose down
docker-compose build --no-cache frontend backend
docker-compose up -d
echo "✅ Containers direstart"
echo ""

# 5. Tunggu containers siap
echo "⏳ Menunggu containers siap..."
sleep 15
echo ""

# 6. Cek status containers
echo "📊 Status containers:"
docker-compose ps
echo ""

# 7. Cek logs untuk memastikan tidak ada error
echo "📋 Cek logs backend (10 baris terakhir):"
docker-compose logs --tail=10 backend
echo ""

echo "📋 Cek logs frontend (10 baris terakhir):"
docker-compose logs --tail=10 frontend
echo ""

echo "✅ Perbaikan selesai!"
echo ""
echo "🔍 Untuk monitoring real-time, jalankan:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "📝 File backup tersimpan dengan ekstensi .backup"
echo "   Jika ada masalah, restore dengan: mv file.backup file.original"
