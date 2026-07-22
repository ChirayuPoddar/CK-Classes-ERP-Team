/**
 * Tenant-scoping middleware for C.K. Classes ERP multi-tenant architecture.
 * MUST run after verifyToken (auth) and BEFORE any scopeMiddleware or controller logic.
 */
const Tenant = require('../models/Tenant')
const User = require('../models/User')

let cachedDefaultTenantId = null

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

    // Fallback: resolve primary default tenant for existing accounts or single-tenant mode
    if (!cachedDefaultTenantId) {
      let defaultTenant = await Tenant.findOne({ slug: 'ck-classes-main' })
      if (!defaultTenant) {
        defaultTenant = await Tenant.findOne({ isActive: true })
      }
      if (!defaultTenant) {
        defaultTenant = await Tenant.create({
          name: 'C.K. Classes Primary',
          slug: 'ck-classes-main',
          contactEmail: 'admin@ckclasses.com',
          isActive: true,
          subscriptionStatus: 'active'
        })
      }
      cachedDefaultTenantId = defaultTenant._id.toString()
    }

    req.tenantId = cachedDefaultTenantId
    if (req.user) {
      req.user.tenantId = cachedDefaultTenantId
      // Asynchronously self-heal user record in DB without blocking the HTTP request
      if (req.user.id) {
        User.updateOne({ _id: req.user.id }, { $set: { tenantId: cachedDefaultTenantId } }).catch(() => {})
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  attachTenantContext
}
