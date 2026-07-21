const ApiError = require('../utils/ApiError')

class SmsService {
  /**
   * Abstract SMS delivery interface stub
   * Throws HTTP 501 SMS_PROVIDER_NOT_CONFIGURED until paid gateway is integrated
   */
  async sendOtpSms({ phone, otp, purpose }) {
    throw new ApiError('SMS provider is not configured.', 501, 'SMS_PROVIDER_NOT_CONFIGURED')
  }
}

module.exports = new SmsService()
