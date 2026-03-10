const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      userId: req.user?.id
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Strict rate limiter for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    timestamp: new Date().toISOString()
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl
    });

    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again after 15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiter for Accurate API sync
 */
const syncLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 sync requests per minute
  message: {
    success: false,
    message: 'Too many sync requests, please wait',
    timestamp: new Date().toISOString()
  },
  handler: (req, res) => {
    logger.warn('Sync rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id
    });

    res.status(429).json({
      success: false,
      message: 'Too many sync requests, please wait a moment',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  syncLimiter
};
