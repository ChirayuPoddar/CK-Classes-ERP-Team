const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  channel: {
    type: String,
    required: true,
    enum: ['email', 'sms']
  },
  purpose: {
    type: String,
    required: true,
    enum: [
      'email_verification',
      'phone_verification',
      'password_reset',
      'login',
      'student_activation',
      'parent_activation',
      'staff_activation'
    ]
  },
  otpHash: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  expiresAt: {
    type: Date,
    required: true
  },
  usedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

// Compound Index for fast lookup
otpSchema.index({ identifier: 1, purpose: 1 })

// MongoDB TTL Index for automatic background expiration cleanup
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Otp = mongoose.model('Otp', otpSchema)
module.exports = Otp
