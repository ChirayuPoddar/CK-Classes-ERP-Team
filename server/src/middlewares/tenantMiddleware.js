/**
 * Tenant-scoping middleware for C.K. Classes ERP multi-tenant architecture.
 * MUST run after verifyToken (auth) and BEFORE any scopeMiddleware or controller logic.
 */
const attachTenantContext = (req, res, next) => {
  try {
    // If tenant context is already attached (e.g. from prior middleware or socket context), proceed
    if (req.tenantId) {
      return next()
    }

    // Read tenantId from authenticated user profile
    if (!req.user || !req.user.tenantId) {
      return res.status(403).json({
        success: false,
        code: 'TENANT_CONTEXT_MISSING',
        message: 'Tenant context is required to access this resource.',
        error: {
          message: 'Tenant context is required to access this resource.',
          code: 'TENANT_CONTEXT_MISSING'
        }
      })
    }

    // Attach tenantId to req for use in every subsequent controller, service, and scope check
    req.tenantId = req.user.tenantId
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  attachTenantContext
}
