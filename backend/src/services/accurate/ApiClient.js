const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');
const { retryAccurateAPI } = require('../../utils/retry');
const TokenManager = require('./TokenManager');
const { AppError } = require('../../middleware/errorHandler');

class AccurateApiClient {
  constructor() {
    this.accountUrl = config.accurate.accountUrl;
    // Cache per user (host + session hasil open-db)
    this.dbSessionCache = new Map();
    this.dbSessionCacheTime = new Map();
    
    // Rate limiting sesuai pedoman Accurate Online
    // Maksimal 8 request per detik dan 8 proses paralel
    this.requestQueue = [];
    this.activeRequests = 0;
    this.maxParallelRequests = config.accurate.rateLimit?.maxParallelProcesses || 8;
    this.requestsThisSecond = 0;
    this.maxRequestsPerSecond = config.accurate.rateLimit?.maxRequestsPerSecond || 8;
    this.lastResetTime = Date.now();
  }

  /**
   * Rate limiting - tunggu jika sudah mencapai batas
   */
  async waitForRateLimit() {
    const now = Date.now();
    
    // Reset counter setiap detik
    if (now - this.lastResetTime >= 1000) {
      this.requestsThisSecond = 0;
      this.lastResetTime = now;
    }
    
    // Tunggu jika sudah mencapai batas request per detik
    if (this.requestsThisSecond >= this.maxRequestsPerSecond) {
      const waitTime = 1000 - (now - this.lastResetTime);
      if (waitTime > 0) {
        logger.info('Rate limit reached, waiting...', { waitTime });
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestsThisSecond = 0;
        this.lastResetTime = Date.now();
      }
    }
    
    // Tunggu jika sudah mencapai batas proses paralel
    while (this.activeRequests >= this.maxParallelRequests) {
      logger.info('Max parallel requests reached, waiting...', { activeRequests: this.activeRequests });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.requestsThisSecond++;
    this.activeRequests++;
  }

  /**
   * Release rate limit counter
   */
  releaseRateLimit() {
    this.activeRequests--;
  }

  /**
   * Resolve database id for OAuth token
   */
  async resolveDatabaseId(accessToken) {
    if (config.accurate.databaseId) {
      return config.accurate.databaseId;
    }

    // Jika belum diset di env, coba ambil dari db-list.do
    try {
      const url = `${this.accountUrl}/api/db-list.do`;
      logger.logAccurateRequest('GET', url);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });

      logger.logAccurateResponse('GET', '/api/db-list.do', response.status, response.data);

      if (!response.data?.s || !Array.isArray(response.data?.d)) {
        throw new AppError('Invalid db-list response from Accurate', 500);
      }

      const dbs = response.data.d;
      if (dbs.length === 1 && dbs[0]?.id) {
        return dbs[0].id;
      }

      // Lebih aman: minta admin set DB id kalau lebih dari 1 database
      throw new AppError(
        'Accurate punya lebih dari 1 database. Set `ACCURATE_DATABASE_ID` di environment backend (ambil id dari /api/db-list.do).',
        412,
        { provider: 'accurate', needsDatabaseSelection: true, databases: dbs.map(d => ({ id: d.id, alias: d.alias })) }
      );
    } catch (error) {
      logger.logAccurateError('GET', '/api/db-list.do', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to resolve Accurate database ID', 500);
    }
  }

  /**
   * Open DB to obtain host + session for Accurate API calls (OAuth flow)
   */
  async getHostAndSession(userId, accessToken) {
    // Cache (12 jam) supaya tidak open-db setiap request
    const cached = this.dbSessionCache.get(userId);
    const cachedTime = this.dbSessionCacheTime.get(userId);
    if (cached && cachedTime) {
      const ageHours = (Date.now() - cachedTime) / (1000 * 60 * 60);
      if (ageHours < 12) return cached;
    }

    const dbId = await this.resolveDatabaseId(accessToken);

    try {
      const url = `${this.accountUrl}/api/open-db.do`;
      logger.logAccurateRequest('GET', `${url}?id=${encodeURIComponent(String(dbId))}`);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { id: dbId },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });

      logger.logAccurateResponse('GET', '/api/open-db.do', response.status, response.data);

      if (!response.data?.s) {
        const msg = Array.isArray(response.data?.d) ? response.data.d.join(', ') : 'Open DB failed';
        throw new AppError(msg, 400);
      }

      let host = response.data.host;
      const session = response.data.session;

      if (!host || !session) {
        throw new AppError('Open DB response missing host/session', 500);
      }

      if (!host.startsWith('http://') && !host.startsWith('https://')) {
        host = `https://${host}`;
      }

      const result = { host, session, databaseId: dbId };
      this.dbSessionCache.set(userId, result);
      this.dbSessionCacheTime.set(userId, Date.now());

      logger.info('Accurate host/session cached', { userId, host, databaseId: dbId });
      return result;
    } catch (error) {
      logger.logAccurateError('GET', '/api/open-db.do', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to open Accurate database (get host/session)', 500);
    }
  }

  /**
   * Get request headers sesuai pedoman Accurate Online
   */
  async getHeaders(userId) {
    const tokenResult = await TokenManager.getActiveToken(userId);

    if (!tokenResult.success) {
      // Jangan pakai 401 di sini karena 401 dipakai untuk JWT aplikasi di frontend interceptor.
      // Untuk kasus Accurate belum terkoneksi / butuh reconnect, gunakan 412 (precondition failed).
      throw new AppError(tokenResult.message, 412, {
        provider: 'accurate',
        needsReconnect: Boolean(tokenResult.needsReconnect)
      });
    }
    const { session } = await this.getHostAndSession(userId, tokenResult.token.accessToken);

    return {
      'Authorization': `Bearer ${tokenResult.token.accessToken}`,
      'X-Session-ID': session,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Get base URL for API calls
   */
  async getBaseUrl(userId) {
    const tokenResult = await TokenManager.getActiveToken(userId);

    if (!tokenResult.success) {
      throw new AppError(tokenResult.message, 412, {
        provider: 'accurate',
        needsReconnect: Boolean(tokenResult.needsReconnect)
      });
    }

    const { host } = await this.getHostAndSession(userId, tokenResult.token.accessToken);
    return `${host}/accurate/api`;
  }

  /**
   * Make API request with retry dan rate limiting
   */
  async request(userId, method, endpoint, data = null, params = null) {
    // Tunggu jika rate limit tercapai
    await this.waitForRateLimit();
    
    try {
      return await retryAccurateAPI(
        async () => {
          const baseUrl = await this.getBaseUrl(userId);
          const headers = await this.getHeaders(userId);
          const url = `${baseUrl}${endpoint}`;

          logger.logAccurateRequest(method, url, { params, data });

          const config = {
            method,
            url,
            headers,
            timeout: 30000,
            // Sesuai pedoman: aktifkan follow redirect untuk handle perubahan host
            maxRedirects: 5,
            // Pastikan method tidak berubah saat redirect
            validateStatus: (status) => {
              return status >= 200 && status < 400;
            }
          };

          if (data) config.data = data;
          if (params) config.params = params;

          const response = await axios(config);

          logger.logAccurateResponse(method, endpoint, response.status, response.data);

          // Handle redirect 308 - update host cache
          if (response.status === 308) {
            const newHost = response.headers.location;
            if (newHost) {
              logger.info('Host redirect detected, updating cache', { newHost });
              const tokenResult = await TokenManager.getActiveToken(userId);
              this.hostCache.set(tokenResult.token.accessToken, newHost);
              this.hostCacheTime.set(tokenResult.token.accessToken, Date.now());
            }
          }

          // Check if API returned error
          if (response.data.s === false) {
            const errorMsg = Array.isArray(response.data.d) 
              ? response.data.d.join(', ') 
              : 'API returned error';
            throw new AppError(errorMsg, 400);
          }

          return response.data;
        },
        {
          maxAttempts: 3,
          delay: 2000,
          onTokenExpired: async () => {
            // Token will be auto-refreshed by TokenManager
            const tokenResult = await TokenManager.getActiveToken(userId);
            if (!tokenResult.success) {
              throw new AppError(tokenResult.message || 'Token refresh failed', 412, {
                provider: 'accurate',
                needsReconnect: true
              });
            }
          }
        }
      );
    } finally {
      // Release rate limit counter
      this.releaseRateLimit();
    }
  }

  /**
   * GET request - READ ONLY
   */
  async get(userId, endpoint, params = null) {
    return this.request(userId, 'GET', endpoint, null, params);
  }

  /**
   * POST request - DISABLED untuk read-only app
   * Hanya digunakan untuk /api-token.do
   */
  async post(userId, endpoint, data, params = null) {
    // Hanya izinkan POST untuk endpoint tertentu yang diperlukan
    const allowedPostEndpoints = ['/api-token.do'];
    if (!allowedPostEndpoints.some(allowed => endpoint.includes(allowed))) {
      throw new AppError('POST operation not allowed - this is a read-only application', 403);
    }
    return this.request(userId, 'POST', endpoint, data, params);
  }

  /**
   * PUT request - DISABLED untuk read-only app
   */
  async put(userId, endpoint, data, params = null) {
    throw new AppError('PUT operation not allowed - this is a read-only application', 403);
  }

  /**
   * DELETE request - DISABLED untuk read-only app
   */
  async delete(userId, endpoint, params = null) {
    throw new AppError('DELETE operation not allowed - this is a read-only application', 403);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.dbSessionCache.clear();
    this.dbSessionCacheTime.clear();
  }
}

module.exports = new AccurateApiClient();
