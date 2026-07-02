const express = require('express');
const router = express.Router();
const DeviceTokenController = require('../controllers/DeviceTokenController');
const { authenticate } = require('../middleware/auth');
const { validationMiddleware, schemas } = require('../utils/validator');

router.use(authenticate);

router.post('/register',
  validationMiddleware(schemas.registerDeviceToken),
  DeviceTokenController.register
);

module.exports = router;
