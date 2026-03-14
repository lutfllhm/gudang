/**
 * Standard API response utilities
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Error details
 */
const error = (res, message = 'Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const paginated = (res, data, pagination, message = 'Success') => {
  const total = Number(pagination.total ?? 0);
  const limit = Number(pagination.limit) || 20;
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: Number(pagination.page) || 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Created response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

/**
 * No content response
 * @param {Object} res - Express response object
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Bad request response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Error details
 */
const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

/**
 * Internal server error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Error details
 */
const serverError = (res, message = 'Internal server error', errors = null) => {
  return error(res, message, 500, errors);
};

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError
};
