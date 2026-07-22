const express = require('express')
const router = express.Router()
const activationService = require('../services/activationService')
const Tenant = require('../models/Tenant')
const ApiError = require('../utils/ApiError')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')

// Helper: Resolve active tenant safely without revealing enumeration status
const resolveActivationTenant = async (req) => {
  const targetSlug = req.body.institutionSlug || req.body.tenantSlug || req.body.slug
  if (!targetSlug || typeof targetSlug !== 'string') {
    return null
  }
  const cleanSlug = targetSlug.toLowerCase().trim()
  return await Tenant.findOne({ slug: cleanSlug, isActive: true })
}

// PUBLIC: Step 1 - Request Activation OTP using Institution ID (Student ID / Teacher ID)
router.post('/request-otp', async (req, res, next) => {
  try {
    const tenant = await resolveActivationTenant(req)
    if (!tenant) {
      throw new ApiError('Invalid or unavailable activation credentials.', 400, 'ACTIVATION_INVALID')
    }

    const { role, studentId, teacherId } = req.body
    const result = await activationService.requestActivationOtp({ tenantId: tenant._id, role, studentId, teacherId })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

// PUBLIC: Step 2 - Verify Activation OTP
router.post('/verify-otp', async (req, res, next) => {
  try {
    const tenant = await resolveActivationTenant(req)
    if (!tenant) {
      throw new ApiError('Invalid or unavailable activation credentials.', 400, 'ACTIVATION_INVALID')
    }

    const { role, studentId, teacherId, identifier, otp } = req.body
    const result = await activationService.verifyActivationOtp({ tenantId: tenant._id, role, studentId, teacherId, identifier, otp })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

// PUBLIC: Step 3 - Complete Account Activation & Create Password
router.post('/complete', async (req, res, next) => {
  try {
    const tenant = await resolveActivationTenant(req)
    if (!tenant) {
      throw new ApiError('Invalid activation authorization token.', 400, 'INVALID_ACTIVATION_TOKEN')
    }

    const { activationToken, role, studentId, teacherId, password, confirmPassword } = req.body
    const result = await activationService.completeActivation({ tenantId: tenant._id, activationToken, role, studentId, teacherId, password, confirmPassword })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

// ADMIN ONLY: Get Account Activation Status for Target Profile
router.get('/status/:targetId', verifyToken, requirePermission(PERMISSIONS.USERS_VIEW), async (req, res, next) => {
  try {
    const { targetId } = req.params
    const result = await activationService.getAccountActivationStatus(targetId, req.tenantId)
    res.status(200).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

module.exports = router
