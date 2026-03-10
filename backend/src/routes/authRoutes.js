const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validationMiddleware, schemas } = require('../utils/validator');

// Public routes
router.post('/login', 
  authLimiter,
  validationMiddleware(schemas.login),
  AuthController.login
);

router.post('/refresh-token', 
  AuthController.refreshToken
);

// Protected routes
router.use(authenticate);

router.get('/profile', AuthController.getProfile);
router.put('/profile', 
  validationMiddleware(schemas.updateProfile),
  AuthController.updateProfile
);

router.post('/change-password', AuthController.changePassword);
router.get('/activity-logs', AuthController.getActivityLogs);
router.post('/logout', AuthController.logout);

module.exports = router;
