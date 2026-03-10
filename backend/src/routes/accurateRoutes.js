const express = require('express');
const router = express.Router();
const AccurateController = require('../controllers/AccurateController');
const WebhookController = require('../controllers/WebhookController');
const { authenticate } = require('../middleware/auth');

// OAuth routes (public)
router.get('/auth-url', AccurateController.getAuthUrl);
router.get('/callback', AccurateController.handleCallback);

// Webhook routes (public - dipanggil oleh Accurate)
router.post('/webhook', WebhookController.handleWebhook);

// Protected routes
router.use(authenticate);

// Webhook test (protected)
router.get('/webhook/test', WebhookController.testWebhook);

router.get('/status', AccurateController.checkStatus);
router.post('/refresh-token', AccurateController.refreshToken);
router.post('/disconnect', AccurateController.disconnect);
router.get('/token-info', AccurateController.getTokenInfo);

module.exports = router;
