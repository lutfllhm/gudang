const axios = require('axios');
const config = require('../config');
const TokenManager = require('../services/accurate/TokenManager');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');
const logger = require('../utils/logger');

function getPrimaryFrontendOrigin() {
  const origin = config.cors?.origin;
  if (Array.isArray(origin)) return origin[0];
  if (typeof origin === 'string') return origin.split(',')[0].trim(); // backward compatibility
  return 'http://localhost:3000';
}

class AccurateController {
  static getAuthUrl = asyncHandler(async (req, res) => {
    const missing = [];
    if (!config.accurate?.clientId) missing.push('ACCURATE_CLIENT_ID');
    if (!config.accurate?.redirectUri) missing.push('ACCURATE_REDIRECT_URI');
    if (!config.accurate?.accountUrl) missing.push('ACCURATE_ACCOUNT_URL');
    if (missing.length > 0) {
      throw new AppError(`Accurate Online belum dikonfigurasi. Missing: ${missing.join(', ')}`, 400);
    }

    const userId = req.user?.id;
    const stateParam = userId ? `&state=${encodeURIComponent(String(userId))}` : '';

    const authUrl = `${config.accurate.accountUrl}/oauth/authorize?` +
      `client_id=${config.accurate.clientId}` +
      `&redirect_uri=${encodeURIComponent(config.accurate.redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(config.accurate.scopes.join(' '))}` +
      stateParam;

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

    const missing = [];
    if (!config.accurate?.clientId) missing.push('ACCURATE_CLIENT_ID');
    if (!config.accurate?.clientSecret) missing.push('ACCURATE_CLIENT_SECRET');
    if (!config.accurate?.redirectUri) missing.push('ACCURATE_REDIRECT_URI');
    if (!config.accurate?.accountUrl) missing.push('ACCURATE_ACCOUNT_URL');
    if (missing.length > 0) {
      throw new AppError(`Accurate Online belum dikonfigurasi. Missing: ${missing.join(', ')}`, 400);
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

    // Save token (default to user ID 1 if state missing/invalid)
    const userId = Number.isFinite(Number.parseInt(state, 10)) ? Number.parseInt(state, 10) : 1;
    await TokenManager.saveToken(userId, {
      access_token,
      refresh_token,
      expires_in,
      token_type,
      scope
    });

    // Redirect to frontend
    const frontendOrigin = getPrimaryFrontendOrigin();
    res.redirect(`${frontendOrigin}/settings?accurate=connected`);
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
