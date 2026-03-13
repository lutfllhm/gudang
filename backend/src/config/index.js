require('dotenv').config();

function trimTrailingSlashes(url) {
  if (!url) return url;
  return String(url).replace(/\/+$/, '');
}

function parseCommaSeparated(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  const parts = String(value)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  return parts.length === 1 ? parts[0] : parts;
}

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  appName: process.env.APP_NAME || 'iWare Warehouse',

  // Database
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'iware_warehouse',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    charset: 'utf8mb4',
    timezone: '+00:00'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  // Accurate Online
  accurate: {
    accountUrl: trimTrailingSlashes(process.env.ACCURATE_ACCOUNT_URL || 'https://account.accurate.id'),
    apiUrl: trimTrailingSlashes(process.env.ACCURATE_API_URL || 'https://public-api.accurate.id/api'),
    appKey: process.env.ACCURATE_APP_KEY,
    clientId: process.env.ACCURATE_CLIENT_ID,
    clientSecret: process.env.ACCURATE_CLIENT_SECRET,
    redirectUri: process.env.ACCURATE_REDIRECT_URI,
    signatureSecret: process.env.ACCURATE_SIGNATURE_SECRET,
    accessToken: process.env.ACCURATE_ACCESS_TOKEN,
    databaseId: process.env.ACCURATE_DATABASE_ID,
    // Read-only scopes - aplikasi hanya untuk melihat data
    scopes: [
      'item_view',
      'sales_order_view',
      'sales_invoice_view',
      'customer_view',
      'warehouse_view'
    ],
    // API rate limiting sesuai pedoman Accurate
    rateLimit: {
      maxRequestsPerSecond: 8,
      maxParallelProcesses: 8
    }
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB, 10) || 0
  },

  // CORS
  cors: {
    origin: parseCommaSeparated(process.env.CORS_ORIGIN) || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileMaxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
    fileMaxFiles: process.env.LOG_FILE_MAX_FILES || '14d'
  },

  // Sync
  sync: {
    autoEnabled: process.env.AUTO_SYNC_ENABLED === 'true',
    intervalSeconds: parseInt(process.env.SYNC_INTERVAL_SECONDS, 10) || 300,
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE, 10) || 100
  },

  // Webhook
  webhook: {
    secret: process.env.WEBHOOK_SECRET
  }
};

// Validation
const validateConfig = () => {
  const required = [
    'JWT_SECRET',
    'DB_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && config.env === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about missing Accurate credentials but don't fail
  const accurateRequired = [
    'ACCURATE_APP_KEY',
    'ACCURATE_CLIENT_ID',
    'ACCURATE_CLIENT_SECRET',
    'ACCURATE_SIGNATURE_SECRET'
  ];

  const missingAccurate = accurateRequired.filter(key => !process.env[key] || process.env[key].startsWith('temporary_'));

  if (missingAccurate.length > 0) {
    console.warn(`⚠️  Warning: Missing or temporary Accurate credentials: ${missingAccurate.join(', ')}`);
    console.warn('⚠️  Accurate integration features will not work until configured');
  }
};

validateConfig();

module.exports = config;
