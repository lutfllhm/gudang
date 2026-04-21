require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./src/config');
const { testConnection, closePool } = require('./src/config/database');
const logger = require('./src/utils/logger');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Create Express app
const app = express();

// Trust proxy (for Nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}));

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.httpLogger.info(message.trim())
    }
  }));
}

// Rate limiting
app.use('/api', apiLimiter);
// TTS endpoint butuh limit lebih longgar karena dipanggil berulang saat reminder
const ttsLimiter = require('express-rate-limit')({
  windowMs: 60 * 1000, // 1 menit
  max: 200,            // maks 200 request TTS per menit (cukup untuk 100 SO)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/tts', ttsLimiter);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: '2.0.0'
  });
});

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/items', require('./src/routes/itemRoutes'));
app.use('/api/sales-orders', require('./src/routes/salesOrderRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/accurate', require('./src/routes/accurateRoutes'));
app.use('/api/sync', require('./src/routes/syncRoutes'));
app.use('/api/tts', require('./src/routes/ttsRoutes'));

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection with retry
    logger.info('Testing database connection...');
    let dbConnected = false;
    let retries = 10;
    
    while (!dbConnected && retries > 0) {
      try {
        await testConnection();
        dbConnected = true;
        logger.info('✅ Database connected successfully');
      } catch (error) {
        retries--;
        if (retries > 0) {
          logger.warn(`Database connection failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw error;
        }
      }
    }

    // Initialize sync service (non-blocking)
    try {
      const SyncService = require('./src/services/SyncService');
      await SyncService.startAutoSync();
    } catch (error) {
      logger.warn('Failed to start sync service (will continue without it):', error.message);
    }

    // Start listening
    const server = app.listen(config.port, () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 ${config.appName} v2.0`);
      logger.info('='.repeat(50));
      logger.info(`📡 Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🔗 URL: http://localhost:${config.port}`);
      logger.info(`📊 Health: http://localhost:${config.port}/health`);
      logger.info(`🔄 Auto Sync: ${config.sync.autoEnabled ? 'Enabled' : 'Disabled'}`);
      logger.info('='.repeat(50));
    });

    // Initialize WebSocket
    const WebSocketService = require('./src/services/WebSocketService');
    WebSocketService.initialize(server);

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close WebSocket
        try {
          const WebSocketService = require('./src/services/WebSocketService');
          WebSocketService.close();
        } catch (error) {
          logger.warn('Failed to close WebSocket:', error.message);
        }
        
        // Stop sync service
        try {
          const SyncService = require('./src/services/SyncService');
          SyncService.stopAutoSync();
        } catch (error) {
          logger.warn('Failed to stop sync service:', error.message);
        }
        
        // Close queues (optional - only if Redis is available)
        try {
          const QueueService = require('./src/services/QueueService');
          await QueueService.closeAll();
        } catch (error) {
          logger.warn('Failed to close queues:', error.message);
        }
        
        // Close database pool
        await closePool();
        
        logger.info('Shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
