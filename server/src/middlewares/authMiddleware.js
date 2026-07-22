const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { hasPermission } = require('../config/permissions')
const { attachTenantContext } = require('./tenantMiddleware')

const verifyToken = async (req, res, next) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET
  if (!accessSecret) {
    return res.status(500).json({
      success: false,
      error: { message: 'Server authentication configuration error.' }
    })
  }

  const accessCookieName = process.env.JWT_ACCESS_COOKIE_NAME || 'ck_access_token'
  let token = req.cookies[accessCookieName] || req.cookies.ck_access_token

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: { message: 'Authentication session expired. Please sign in again.' }
    })
  }

  try {
    const decoded = jwt.verify(token, accessSecret)

    // Validate token type
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN_TYPE',
        error: { message: 'Invalid authentication token type.' }
      })
    }

    // Database lookup: verify active user and session existence
    const user = await User.findById(decoded.id)
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        code: 'ACCOUNT_BLOCKED',
        error: { message: 'Account is blocked or no longer exists. Please contact administration.' }
      })
    }

    // If session ID is present in payload, verify session existence in database
    if (decoded.sessionId) {
      const now = new Date()
      const activeSession = (user.sessions || []).find(s => s.sessionId === decoded.sessionId && new Date(s.expiresAt) > now)
      
      if (!activeSession) {
        return res.status(401).json({
          success: false,
          code: 'SESSION_REVOKED',
          error: { message: 'Your login session has been revoked or expired.' }
        })
      }
    }

    // Attach trusted user context from database
    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      sessionId: decoded.sessionId || null,
      linkedStudent: user.linkedStudent ? user.linkedStudent.toString() : null,
      linkedTeacher: user.linkedTeacher ? user.linkedTeacher.toString() : null,
      linkedChildren: (user.linkedChildren || []).map(c => c.toString()),
      tenantId: decoded.tenantId ? decoded.tenantId.toString() : (user.tenantId ? user.tenantId.toString() : null)
    }

    return attachTenantContext(req, res, next)
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      error: { message: 'Invalid authentication session. Please sign in again.' }
    })
  }
}

/**
 * Granular Permission Middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        error: { message: 'Authentication required.' }
      })
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
        error: { message: 'You do not have permission to perform this action.' }
      })
    }

    next()
  }
}

/**
 * Legacy Role Guard Middleware
 */
const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
        error: { message: 'Access denied. You do not have permissions for this action.' }
      })
    }
    next()
  }
}

module.exports = { verifyToken, requirePermission, roleGuard }
