const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');
const { retryAccurateAPI } = require('../../utils/retry');
const TokenManager = require('./TokenManager');
const { AppError } = require('../../middleware/errorHandler');

class AccurateApiClient {
  constructor() {
    this.accountUrl = config.accurate.accountUrl;
    this.hostCache = new Map();
    this.hostCacheTime = new Map();
    
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
   * Get dynamic host from API Token
   */
  async getHost(accessToken) {
    // Check cache (30 days)
    const cached = this.hostCache.get(accessToken);
    const cachedTime = this.hostCacheTime.get(accessToken);

    if (cached && cachedTime) {
      const daysSinceCache = (Date.now() - cachedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceCache < 30) {
        return cached;
      }
    }

    try {
      const timestamp = TokenManager.generateTimestamp();
      const signature = TokenManager.generateSignature(timestamp);

      logger.logAccurateRequest('POST', `${this.accountUrl}/api/api-token.do`);

      const response = await axios.post(
        `${this.accountUrl}/api/api-token.do`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Api-Timestamp': timestamp,
            'X-Api-Signature': signature,
            'Content-Type': 'application/json'
          },
          maxRedirects: 5,
          timeout: 30000
        }
      );

      logger.logAccurateResponse('POST', '/api/api-token.do', response.status);

      // Extract host from response
      let host = null;
      if (response.data.s && response.data.d) {
        host = response.data.d.database?.host ||
               response.data.d['data usaha']?.host ||
               response.data.d.dataUsaha?.host ||
               response.data.d.host ||
               response.data.d.session?.host;
      }

      if (!host) {
        logger.error('Host not found in API response, response data:', response.data);
        throw new AppError('Host not found in API response', 500);
      }

      // Ensure host has protocol
      if (!host.startsWith('http://') && !host.startsWith('https://')) {
        host = `https://${host}`;
      }

      // Cache host
      this.hostCache.set(accessToken, host);
      this.hostCacheTime.set(accessToken, Date.now());

      logger.info('Host retrieved and cached', { host });

      return host;
    } catch (error) {
      logger.logAccurateError('POST', '/api/api-token.do', error);
      
      // Fallback: try to extract database ID from token and construct default host
      if (error.response?.status !== 401) {
        logger.warn('Attempting fallback host construction');
        try {
          // Accurate API token format: aat.{base64}.{payload}.{signature}
          const parts = accessToken.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            if (payload.d) {
              // Use database ID to construct host
              const dbId = payload.d;
              const fallbackHost = `https://${dbId}.accurate.id`;
              logger.info('Using fallback host', { fallbackHost, dbId });
              
              // Cache fallback host
              this.hostCache.set(accessToken, fallbackHost);
              this.hostCacheTime.set(accessToken, Date.now());
              
              return fallbackHost;
            }
          }
        } catch (parseError) {
          logger.error('Failed to parse token for fallback', parseError);
        }
      }
      
      throw new AppError('Failed to get API host', 500);
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

    const timestamp = TokenManager.generateTimestamp();
    const signature = TokenManager.generateSignature(timestamp);

    return {
      'Authorization': `Bearer ${tokenResult.token.accessToken}`,
      'X-Api-Timestamp': timestamp,
      'X-Api-Signature': signature,
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

    const host = await this.getHost(tokenResult.token.accessToken);
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
    this.hostCache.clear();
    this.hostCacheTime.clear();
  }
}

module.exports = new AccurateApiClient();
