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

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
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

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
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
