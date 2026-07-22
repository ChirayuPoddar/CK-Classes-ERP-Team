/**
 * Tenant-scoping middleware for C.K. Classes ERP multi-tenant architecture.
 * MUST run after verifyToken (auth) and BEFORE any scopeMiddleware or controller logic.
 */

const attachTenantContext = async (req, res, next) => {
  try {
    // If tenant context is already attached (e.g. from prior middleware or socket context), proceed
    if (req.tenantId) {
      return next()
    }

    // Read tenantId from authenticated user profile if valid
    if (req.user && req.user.tenantId && req.user.tenantId !== 'null' && req.user.tenantId !== 'undefined') {
      req.tenantId = req.user.tenantId
      return next()
    }

    // If neither is present, reject loudly per Phase 2 strict multi-tenant isolation specification
    return res.status(403).json({
      success: false,
      code: 'TENANT_CONTEXT_MISSING',
      error: { message: 'Tenant context missing. Unable to verify institution data isolation.' }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  attachTenantContext
}
