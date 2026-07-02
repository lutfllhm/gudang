const DeviceToken = require('../models/DeviceToken');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

class DeviceTokenController {
  /**
   * Register/refresh FCM device token for the authenticated user
   */
  static register = asyncHandler(async (req, res) => {
    const { fcmToken, platform } = req.body;

    await DeviceToken.upsert({ userId: req.user.id, fcmToken, platform });

    success(res, null, 'Device token registered');
  });
}

module.exports = DeviceTokenController;
