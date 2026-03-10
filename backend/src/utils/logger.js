const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logs directory
const logsDir = path.join(__dirname, '../../logs');

// Transport for all logs
const allLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'all-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.logging.fileMaxSize,
  maxFiles: config.logging.fileMaxFiles,
  format: logFormat
});

// Transport for error logs
const errorLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: config.logging.fileMaxSize,
  maxFiles: config.logging.fileMaxFiles,
  format: logFormat
});

// Transport for Accurate API logs
const accurateLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'accurate-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.logging.fileMaxSize,
  maxFiles: config.logging.fileMaxFiles,
  format: logFormat
});

// Create logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    allLogsTransport,
    errorLogsTransport
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles
    })
  ]
});

// Add console transport in development
if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Accurate API logger
const accurateLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [accurateLogsTransport]
});

// HTTP request logger (for Morgan)
const httpLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles
    })
  ]
});

// Helper methods
logger.logAccurateRequest = (method, url, params = {}) => {
  accurateLogger.info('Accurate API Request', {
    method,
    url,
    params,
    timestamp: new Date().toISOString()
  });
};

logger.logAccurateResponse = (method, url, status, data = {}) => {
  accurateLogger.info('Accurate API Response', {
    method,
    url,
    status,
    data,
    timestamp: new Date().toISOString()
  });
};

logger.logAccurateError = (method, url, error) => {
  accurateLogger.error('Accurate API Error', {
    method,
    url,
    error: error.message,
    stack: error.stack,
    response: error.response?.data,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
module.exports.httpLogger = httpLogger;
