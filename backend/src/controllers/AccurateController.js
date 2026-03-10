const axios = require('axios');
const config = require('../config');
const TokenManager = require('../services/accurate/TokenManager');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');
const logger = require('../utils/logger');

class AccurateController {
  static getAuthUrl = asyncHandler(async (req, res) => {
    const authUrl = `${config.accurate.accountUrl}/oauth/authorize?` +
      `client_id=${config.accurate.clientId}` +
      `&redirect_uri=${encodeURIComponent(config.accurate.redirectUri)}` +
      `&response_type=code` +
      `&scope=${config.accurate.scopes.join(' ')}`;

    success(res, { authUrl });
  });

  static handleCallback = asyncHandler(async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not found'
      });
    }

    // Exchange code for token
    const tokenResponse = await axios.post(
      `${config.accurate.accountUrl}/oauth/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.accurate.clientId,
        client_secret: config.accurate.clientSecret,
        code: code,
        redirect_uri: config.accurate.redirectUri
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in, token_type, scope } = tokenResponse.data;

    // Save token (default to user ID 1 if not authenticated)
    const userId = state || 1;
    await TokenManager.saveToken(userId, {
      access_token,
      refresh_token,
      expires_in,
      token_type,
      scope
    });

    // Redirect to frontend
    res.redirect(`${config.cors.origin}/settings?accurate=connected`);
  });

  static refreshToken = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const tokenResult = await TokenManager.getActiveToken(userId);

    if (!tokenResult.success) {
      return res.status(400).json({
        success: false,
        message: tokenResult.message
      });
    }

    // Refresh will happen automatically in TokenManager
    success(res, null, 'Token refreshed successfully');
  });

  static checkStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const hasToken = await TokenManager.hasActiveToken(userId);

    if (!hasToken) {
      return success(res, {
        connected: false,
        message: 'Not connected to Accurate Online'
      });
    }

    const tokenResult = await TokenManager.getActiveToken(userId);

    success(res, {
      connected: tokenResult.success,
      expiresAt: tokenResult.token?.expiresAt,
      message: tokenResult.success ? 'Connected' : tokenResult.message
    });
  });

  static disconnect = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await TokenManager.revokeToken(userId);

    success(res, null, 'Disconnected from Accurate Online');
  });

  static getTokenInfo = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const tokenResult = await TokenManager.getActiveToken(userId);

    if (!tokenResult.success) {
      return res.status(400).json({
        success: false,
        message: tokenResult.message
      });
    }

    success(res, {
      expiresAt: tokenResult.token.expiresAt,
      scope: tokenResult.token.scope
    });
  });
}

module.exports = AccurateController;
