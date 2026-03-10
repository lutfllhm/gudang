const Joi = require('joi');

/**
 * Validate request body/query/params
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @returns {Object} - Validation result
 */
const validate = (data, schema) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      value: null
    };
  }

  return {
    isValid: true,
    errors: null,
    value
  };
};

/**
 * Validation middleware
 * @param {Object} schema - Joi schema
 * @param {string} source - Source of data (body, query, params)
 * @returns {Function} - Express middleware
 */
const validationMiddleware = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const result = validate(data, schema);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: result.errors
      });
    }

    // Replace with validated data
    req[source] = result.value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  register: Joi.object({
    nama: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'superadmin').default('admin')
  }),

  updateProfile: Joi.object({
    nama: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    foto_profil: Joi.string().uri()
  }),

  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Search schema
  search: Joi.object({
    q: Joi.string().min(1).max(255),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // Date range schema
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  // ID param schema
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // Sync schema
  sync: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    force: Joi.boolean().default(false)
  }),

  // User management
  createUser: Joi.object({
    nama: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'superadmin').required()
  }),

  updateUser: Joi.object({
    nama: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string().valid('admin', 'superadmin'),
    status: Joi.string().valid('aktif', 'nonaktif')
  })
};

module.exports = {
  validate,
  validationMiddleware,
  schemas
};
