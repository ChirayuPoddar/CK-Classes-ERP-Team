const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const PasswordResetToken = require('../models/PasswordResetToken')
const { verifyToken } = require('../middlewares/authMiddleware')
const { hashToken } = require('../utils/hashToken')
const otpService = require('../services/otpService')
const { validatePasswordFormat } = require('../validators/userValidator')
const ApiError = require('../utils/ApiError')

// Helper: Generate Access and Refresh Tokens with Session ID & Type
const generateTokens = (user, sessionId) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET
  const refreshSecret = process.env.JWT_REFRESH_SECRET

  if (!accessSecret || !refreshSecret) {
    throw new Error('Server authentication configuration error: Secrets missing.')
  }

  const accessToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      sessionId,
      type: 'access'
    },
    accessSecret,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  )

  const refreshToken = jwt.sign(
    {
      id: user._id,
      sessionId,
      type: 'refresh'
    },
    refreshSecret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )

  return { accessToken, refreshToken }
}

// Helper: Shared Cookie Options (single source of truth for domain/sameSite/secure)
// - COOKIE_DOMAIN: set only when frontend & backend share a root domain (e.g. ".ckclasses.com")
//   Leave unset for cross-site hosts (e.g. app.onrender.com / api.onrender.com) - in that case
//   set COOKIE_SAMESITE=none explicitly, since cross-site cookies require SameSite=None; Secure.
// Used consistently by setCookies() and every clearCookie() call below so logout/reset-password
// clear cookies with the exact same attributes they were set with.
const getBaseCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production'
  const sameSite = process.env.COOKIE_SAMESITE || 'lax'

  const options = {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    path: '/'
  }

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN
  }

  return options
}

// Helper: Configure Cookies
const setCookies = (res, accessToken, refreshToken) => {
  const accessCookieName = process.env.JWT_ACCESS_COOKIE_NAME || 'ck_access_token'
  const refreshCookieName = process.env.JWT_REFRESH_COOKIE_NAME || 'ck_refresh_token'

  const baseCookieOptions = getBaseCookieOptions()

  if (accessToken) {
    res.cookie(accessCookieName, accessToken, {
      ...baseCookieOptions,
      maxAge: 15 * 60 * 1000 // 15 Minutes
    })
  }

  if (refreshToken) {
    res.cookie(refreshCookieName, refreshToken, {
      ...baseCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
    })
  }
}

// POST: Login Route
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' }
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' }
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        code: 'ACCOUNT_BLOCKED',
        error: { message: 'Your account has been blocked. Please contact administration.' }
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' }
      })
    }

    // Same-Browser Account Switching Cleanup
    const refreshCookieName = process.env.JWT_REFRESH_COOKIE_NAME || 'ck_refresh_token'
    const existingRefreshCookie = req.cookies[refreshCookieName] || req.cookies.ck_refresh_token
    const refreshSecret = process.env.JWT_REFRESH_SECRET

    if (existingRefreshCookie && refreshSecret) {
      try {
        const decodedPrev = jwt.verify(existingRefreshCookie, refreshSecret)
        if (decodedPrev && decodedPrev.id && decodedPrev.sessionId) {
          const prevUser = await User.findById(decodedPrev.id)
          if (prevUser) {
            prevUser.sessions = (prevUser.sessions || []).filter(s => s.sessionId !== decodedPrev.sessionId)
            await prevUser.save()
          }
        }
      } catch (err) {
        // Silently ignore expired or invalid cookies
      }
    }

    // Session Tracking & Oldest Session Replacement
    const now = new Date()
    user.sessions = (user.sessions || []).filter(s => new Date(s.expiresAt) > now)
    user.sessions.sort((a, b) => new Date(a.createdAt || a.lastActiveAt) - new Date(b.createdAt || b.lastActiveAt))

    const roleLimits = {
      student: 1,
      teacher: 2,
      parent: 2,
      admin: 2,
      receptionist: 2,
      accountant: 2
    }
    const maxSessions = roleLimits[user.role.toLowerCase()] || 2

    while (user.sessions.length >= maxSessions) {
      user.sessions.shift()
    }

    const sessionId = crypto.randomUUID()
    const { accessToken, refreshToken } = generateTokens(user, sessionId)
    const refreshTokenHash = hashToken(refreshToken)

    const ua = req.headers['user-agent'] || ''
    const isMobile = /mobile|iphone|ipad|android/i.test(ua)
    const device = isMobile ? 'Mobile Device' : 'Desktop Device'
    
    let browser = 'Unknown Browser'
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edg')) browser = 'Edge'
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

    const newSession = {
      sessionId,
      refreshTokenHash,
      device,
      browser,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      createdAt: now,
      lastActiveAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

    user.sessions.push(newSession)
    user.lastLogin = now
    await user.save()

    setCookies(res, accessToken, refreshToken)

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        sessionId: newSession.sessionId
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST: Refresh Token Route
router.post('/refresh', async (req, res, next) => {
  const refreshCookieName = process.env.JWT_REFRESH_COOKIE_NAME || 'ck_refresh_token'
  const refreshToken = req.cookies[refreshCookieName] || req.cookies.ck_refresh_token
  const refreshSecret = process.env.JWT_REFRESH_SECRET
  const accessSecret = process.env.JWT_ACCESS_SECRET

  if (!refreshSecret || !accessSecret) {
    return res.status(500).json({
      success: false,
      error: { message: 'Server authentication configuration error.' }
    })
  }

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: { message: 'Authentication expired. Please sign in.' }
    })
  }

  try {
    const decoded = jwt.verify(refreshToken, refreshSecret)

    if (decoded.type && decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN_TYPE',
        error: { message: 'Invalid token type.' }
      })
    }

    const user = await User.findById(decoded.id)
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        code: 'ACCOUNT_BLOCKED',
        error: { message: 'Account is blocked or no longer exists. Please sign in again.' }
      })
    }

    const now = new Date()
    const session = (user.sessions || []).find(s => s.sessionId === decoded.sessionId)
    
    if (!session) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_REVOKED',
        error: { message: 'Your login session has been revoked or expired.' }
      })
    }

    if (new Date(session.expiresAt) <= now) {
      user.sessions = user.sessions.filter(s => s.sessionId !== decoded.sessionId)
      await user.save()
      return res.status(401).json({
        success: false,
        code: 'SESSION_EXPIRED',
        error: { message: 'Session expired. Please sign in again.' }
      })
    }

    const incomingHash = hashToken(refreshToken)
    if (session.refreshTokenHash && session.refreshTokenHash !== incomingHash) {
      user.sessions = user.sessions.filter(s => s.sessionId !== decoded.sessionId)
      await user.save()
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_REUSED',
        error: { message: 'Invalid refresh token. Session revoked for security.' }
      })
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user, session.sessionId)

    session.refreshTokenHash = hashToken(newRefreshToken)
    session.lastActiveAt = now
    await user.save()

    setCookies(res, newAccessToken, newRefreshToken)

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: { message: 'Session invalid. Please log in again.' }
    })
  }
})

// POST: Logout Route (Current Device)
router.post('/logout', async (req, res, next) => {
  const refreshCookieName = process.env.JWT_REFRESH_COOKIE_NAME || 'ck_refresh_token'
  const accessCookieName = process.env.JWT_ACCESS_COOKIE_NAME || 'ck_access_token'
  const refreshToken = req.cookies[refreshCookieName] || req.cookies.ck_refresh_token
  const refreshSecret = process.env.JWT_REFRESH_SECRET

  try {
    if (refreshToken && refreshSecret) {
      try {
        const decoded = jwt.verify(refreshToken, refreshSecret)
        const user = await User.findById(decoded.id)
        if (user && decoded.sessionId) {
          user.sessions = (user.sessions || []).filter(s => s.sessionId !== decoded.sessionId)
          await user.save()
        }
      } catch {
        // Suppress decode error
      }
    }

    const clearOptions = getBaseCookieOptions()

    res.clearCookie(accessCookieName, clearOptions)
    res.clearCookie(refreshCookieName, clearOptions)
    res.clearCookie('ck_access_token', clearOptions)
    res.clearCookie('ck_refresh_token', clearOptions)
    res.clearCookie('ck_session_token', clearOptions)

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    next(error)
  }
})

// POST: Logout All Devices Route
router.post('/logout-all', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (user) {
      user.sessions = []
      await user.save()
    }

    const accessCookieName = process.env.JWT_ACCESS_COOKIE_NAME || 'ck_access_token'
    const refreshCookieName = process.env.JWT_REFRESH_COOKIE_NAME || 'ck_refresh_token'
    const clearOptions = getBaseCookieOptions()

    res.clearCookie(accessCookieName, clearOptions)
    res.clearCookie(refreshCookieName, clearOptions)

    res.status(200).json({
      success: true,
      message: 'Signed out from all devices successfully.'
    })
  } catch (error) {
    next(error)
  }
})

// POST: Forgot Password Route (Enumeration-Safe)
router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body

  try {
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: { message: 'Email address is required', field: 'email' }
      })
    }

    const cleanEmail = email.toLowerCase().trim()
    const genericSuccessResponse = {
      success: true,
      message: 'If an account exists for this email, a verification code has been sent.'
    }

    // Check if an active account exists
    const user = await User.findOne({ email: cleanEmail, isActive: true })

    if (user) {
      // Request OTP via Centralized OTP Infrastructure
      await otpService.requestOtp({
        identifier: cleanEmail,
        channel: 'email',
        purpose: 'password_reset',
        userId: user._id
      })
    }

    // Always return generic enumeration-safe response
    res.status(200).json(genericSuccessResponse)
  } catch (error) {
    next(error)
  }
})

// POST: Verify Reset OTP Route (Issues Hashed Reset Token)
router.post('/verify-reset-otp', async (req, res, next) => {
  const { email, otp } = req.body

  try {
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: { message: 'Email and verification code are required' }
      })
    }

    const cleanEmail = email.toLowerCase().trim()

    // 1. Verify OTP with central service
    await otpService.verifyOtp({
      identifier: cleanEmail,
      purpose: 'password_reset',
      otp
    })

    // 2. Find user account
    const user = await User.findOne({ email: cleanEmail, isActive: true })
    if (!user) {
      throw new ApiError('User account not found or is blocked.', 404, 'USER_NOT_FOUND')
    }

    // 3. Purge previous unused reset tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id })

    // 4. Generate cryptographically random reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex')

    // 5. Store ONLY SHA-256 hash in database with 10-minute expiry
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    })

    // 6. Atomically consume the OTP code
    await otpService.consumeOtp({
      identifier: cleanEmail,
      purpose: 'password_reset',
      otp
    })

    res.status(200).json({
      success: true,
      message: 'Verification code verified successfully.',
      resetToken: rawResetToken
    })
  } catch (error) {
    next(error)
  }
})

// POST: Reset Password Route (Atomically Reset Password & Revoke All Sessions)
router.post('/reset-password', async (req, res, next) => {
  const { resetToken, token, newPassword, password, confirmPassword } = req.body

  const tokenToUse = resetToken || token
  const pwdToUse = newPassword || password

  try {
    if (!tokenToUse) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: { message: 'Reset token is required.' }
      })
    }

    if (!pwdToUse) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: { message: 'New password is required.' }
      })
    }

    if (confirmPassword && pwdToUse !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: { message: 'Passwords do not match.' }
      })
    }

    // Validate new password using centralized policy
    if (!validatePasswordFormat(pwdToUse)) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: { message: 'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' }
      })
    }

    // SHA-256 Hash of incoming reset token
    const tokenHash = crypto.createHash('sha256').update(tokenToUse).digest('hex')

    // Find active, unused, unexpired reset token record
    const resetTokenRecord = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() }
    })

    if (!resetTokenRecord) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_RESET_TOKEN',
        error: { message: 'Invalid or expired password reset link.' }
      })
    }

    // Mark reset token as used atomically
    resetTokenRecord.usedAt = new Date()
    await resetTokenRecord.save()

    // Find user
    const user = await User.findById(resetTokenRecord.userId)
    if (!user) {
      throw new ApiError('User account not found.', 404, 'USER_NOT_FOUND')
    }

    // Hash new password with bcrypt
    const salt = await bcrypt.genSalt(10)
    user.passwordHash = await bcrypt.hash(pwdToUse, salt)

    // REVOKE ALL SESSIONS ACROSS ALL DEVICES
    user.sessions = []
    user.resetPasswordToken = null
    user.resetPasswordExpires = null

    await user.save()

    // Purge reset token records & password_reset OTPs
    await PasswordResetToken.deleteMany({ userId: user._id })
    await otpService.invalidateOtp({ identifier: user.email, purpose: 'password_reset' })

    // Clear authentication cookies from current browser
    const clearOptions = getBaseCookieOptions()

    res.clearCookie(process.env.JWT_ACCESS_COOKIE_NAME || 'ck_access_token', clearOptions)
    res.clearCookie(process.env.JWT_REFRESH_COOKIE_NAME || 'ck_refresh_token', clearOptions)
    res.clearCookie('ck_access_token', clearOptions)
    res.clearCookie('ck_refresh_token', clearOptions)

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please sign in with your new password.'
    })
  } catch (error) {
    next(error)
  }
})

// POST: Fallback Reset Password URL Route
router.post('/reset-password/:token', async (req, res, next) => {
  const { token } = req.params
  const { password, confirmPassword } = req.body
  req.body = { resetToken: token, newPassword: password, confirmPassword }
  return router.handle(req, res, next)
})

// GET: Profile Check (Me) Route
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash')

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        code: 'ACCOUNT_BLOCKED',
        error: { message: 'User is inactive or profile does not exist' }
      })
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
