const express = require('express')
const router = express.Router()
const activationService = require('../services/activationService')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')

// PUBLIC: Step 1 - Request Activation OTP using Institution ID (Student ID / Teacher ID)
router.post('/request-otp', async (req, res, next) => {
  try {
    const { role, studentId, teacherId } = req.body
    const result = await activationService.requestActivationOtp({ role, studentId, teacherId })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

// PUBLIC: Step 2 - Verify Activation OTP
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { role, studentId, teacherId, identifier, otp } = req.body
    const result = await activationService.verifyActivationOtp({ role, studentId, teacherId, identifier, otp })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

// PUBLIC: Step 3 - Complete Account Activation & Create Password
router.post('/complete', async (req, res, next) => {
  try {
    const { activationToken, role, studentId, teacherId, password, confirmPassword } = req.body
    const result = await activationService.completeActivation({ activationToken, role, studentId, teacherId, password, confirmPassword })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

// ADMIN ONLY: Get Account Activation Status for Target Profile
router.get('/status/:targetId', verifyToken, requirePermission(PERMISSIONS.USERS_VIEW), async (req, res, next) => {
  try {
    const { targetId } = req.params
    const result = await activationService.getAccountActivationStatus(targetId)
    res.status(200).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

module.exports = router
