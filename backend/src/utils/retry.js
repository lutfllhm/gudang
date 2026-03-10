const logger = require('./logger');

/**
 * Retry utility with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of function
 */
const retry = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry = null,
    shouldRetry = (error) => true
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (!shouldRetry(error)) {
        throw error;
      }

      // Last attempt, throw error
      if (attempt === maxAttempts) {
        logger.error(`Retry failed after ${maxAttempts} attempts`, {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }

      // Calculate delay with exponential backoff
      const waitTime = delay * Math.pow(backoff, attempt - 1);

      logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${waitTime}ms`, {
        error: error.message
      });

      // Call onRetry callback if provided
      if (onRetry) {
        await onRetry(attempt, error);
      }

      // Wait before retry
      await sleep(waitTime);
    }
  }

  throw lastError;
};

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry with specific error handling for Accurate API
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise}
 */
const retryAccurateAPI = async (fn, options = {}) => {
  return retry(fn, {
    maxAttempts: options.maxAttempts || 3,
    delay: options.delay || 2000,
    backoff: options.backoff || 2,
    shouldRetry: (error) => {
      // Retry on network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return true;
      }

      // Retry on 5xx errors
      if (error.response?.status >= 500) {
        return true;
      }

      // Retry on rate limit (429)
      if (error.response?.status === 429) {
        return true;
      }

      // Retry on token expired (401)
      if (error.response?.status === 401) {
        return true;
      }

      // Don't retry on other errors
      return false;
    },
    onRetry: async (attempt, error) => {
      logger.logAccurateError('RETRY', 'Accurate API', error);

      // If token expired, try to refresh
      if (error.response?.status === 401 && options.onTokenExpired) {
        await options.onTokenExpired();
      }
    }
  });
};

module.exports = {
  retry,
  retryAccurateAPI,
  sleep
};
