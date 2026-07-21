const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'teacher', 'student', 'parent', 'receptionist', 'accountant'],
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  linkedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  linkedStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  linkedChildren: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  lastLogin: {
    type: Date,
    default: null
  },
  maxSessions: {
    type: Number,
    default: 2
  },
  sessions: [{
    sessionId: { type: String, required: true },
    refreshTokenHash: { type: String },
    device: { type: String, default: 'Desktop Device' },
    browser: { type: String, default: 'Browser' },
    ip: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  }],
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

// Match input password with stored hash
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash)
}

const User = mongoose.model('User', userSchema)
module.exports = User
