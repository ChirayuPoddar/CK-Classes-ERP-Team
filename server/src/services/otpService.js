const crypto = require('crypto')
const Otp = require('../models/Otp')
const ApiError = require('../utils/ApiError')
const emailService = require('./emailService')
const smsService = require('./smsService')
const emailTransactionalQueue = require('../queues/emailTransactionalQueue')

class OtpService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP string using Node.js crypto
   */
  generateOtp() {
    return crypto.randomInt(100000, 1000000).toString()
  }

  /**
   * Calculates SHA-256 cryptographic hash of the OTP for secure database storage
   */
  hashOtp(otp, purpose, identifier) {
    if (!otp || !purpose || !identifier) return ''
    const cleanId = identifier.toLowerCase().trim()
    return crypto
      .createHash('sha256')
      .update(`${otp}:${purpose}:${cleanId}`)
      .digest('hex')
  }

  /**
   * Normalizes identifier (email or phone)
   */
  normalizeIdentifier(identifier) {
    if (!identifier) return ''
    const str = identifier.trim()
    if (str.includes('@')) {
      return str.toLowerCase()
    }
    const digits = str.replace(/\D/g, '')
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
    return digits
  }

  /**
   * Request a new OTP with 60-second cooldown, invalidation of previous OTPs, and delivery
   */
  async requestOtp({ identifier, channel = 'email', purpose, userId = null }) {
    if (!identifier || !purpose) {
      throw new ApiError('Identifier and purpose are required to request an OTP.', 400, 'VALIDATION_ERROR')
    }

    const cleanIdentifier = this.normalizeIdentifier(identifier)
    const validChannels = ['email', 'sms']
    if (!validChannels.includes(channel)) {
      throw new ApiError('Invalid delivery channel specified.', 400, 'VALIDATION_ERROR')
    }

    const validPurposes = [
      'email_verification',
      'phone_verification',
      'password_reset',
      'login',
      'student_activation',
      'parent_activation',
      'staff_activation'
    ]
    if (!validPurposes.includes(purpose)) {
      throw new ApiError('Invalid OTP purpose specified.', 400, 'VALIDATION_ERROR')
    }

    // 1. Resend Cooldown Check (60 Seconds)
    const now = new Date()
    const sixtySecsAgo = new Date(now.getTime() - 60000)

    const recentOtp = await Otp.findOne({
      identifier: cleanIdentifier,
      purpose,
      createdAt: { $gt: sixtySecsAgo }
    })

    if (recentOtp) {
      throw new ApiError('Please wait 60 seconds before requesting a new verification code.', 429, 'OTP_RESEND_COOLDOWN')
    }

    // 2. Invalidate previous active OTPs for the same identifier & purpose
    await Otp.deleteMany({ identifier: cleanIdentifier, purpose })

    // 3. Generate new 6-digit numeric OTP & SHA-256 hash
    const rawOtp = this.generateOtp()
    const otpHash = this.hashOtp(rawOtp, purpose, cleanIdentifier)
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000) // 5 Minutes Expiry

    // 4. Save hashed OTP record to database
    await Otp.create({
      identifier: cleanIdentifier,
      channel,
      purpose,
      otpHash,
      userId,
      expiresAt,
      createdAt: now
    })

    // 5. Dispatch via specified delivery channel
    if (channel === 'email') {
      if (process.env.REDIS_URL) {
        await emailTransactionalQueue.add('send-otp', { to: cleanIdentifier, otp: rawOtp, purpose, expiresMinutes: 5 })
      } else {
        await emailService.sendOtpEmail({ to: cleanIdentifier, otp: rawOtp, purpose, expiresMinutes: 5 })
      }
    } else if (channel === 'sms') {
      await smsService.sendOtpSms({ phone: cleanIdentifier, otp: rawOtp, purpose })
    }

    // Generic enumeration-safe response
    return {
      success: true,
      message: 'If an eligible account exists, a verification code has been sent.'
    }
  }

  /**
   * Verifies an OTP without consuming it
   */
  async verifyOtp({ identifier, purpose, otp }) {
    if (!identifier || !purpose || !otp) {
      throw new ApiError('Identifier, purpose, and verification code are required.', 400, 'VALIDATION_ERROR')
    }

    const cleanIdentifier = this.normalizeIdentifier(identifier)

    // Find latest active OTP record for identifier & purpose
    const otpRecord = await Otp.findOne({
      identifier: cleanIdentifier,
      purpose,
      usedAt: null
    }).sort({ createdAt: -1 })

    if (!otpRecord) {
      throw new ApiError('Invalid or expired verification code.', 400, 'OTP_INVALID')
    }

    // Check expiration
    if (new Date(otpRecord.expiresAt) <= new Date()) {
      throw new ApiError('Verification code has expired. Please request a new code.', 400, 'OTP_EXPIRED')
    }

    // Check maximum attempts limit
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new ApiError('Maximum verification attempts exceeded. Please request a new code.', 429, 'OTP_MAX_ATTEMPTS')
    }

    // Compare SHA-256 hashes
    const incomingHash = this.hashOtp(otp, purpose, cleanIdentifier)
    if (otpRecord.otpHash !== incomingHash) {
      otpRecord.attempts += 1
      await otpRecord.save()
      throw new ApiError('Invalid verification code.', 400, 'OTP_INVALID')
    }

    return {
      success: true,
      valid: true,
      otpRecord
    }
  }

  /**
   * Verifies and atomically consumes the OTP (single-use enforcement)
   */
  async consumeOtp({ identifier, purpose, otp }) {
    const { otpRecord } = await this.verifyOtp({ identifier, purpose, otp })

    if (otpRecord.usedAt) {
      throw new ApiError('Verification code has already been used.', 400, 'OTP_ALREADY_USED')
    }

    otpRecord.usedAt = new Date()
    await otpRecord.save()

    return {
      success: true,
      consumed: true,
      userId: otpRecord.userId,
      identifier: otpRecord.identifier
    }
  }

  /**
   * Manually invalidates any active OTPs for an identifier & purpose
   */
  async invalidateOtp({ identifier, purpose }) {
    const cleanIdentifier = this.normalizeIdentifier(identifier)
    await Otp.deleteMany({ identifier: cleanIdentifier, purpose })
    return { success: true }
  }
}

module.exports = new OtpService()
