const express = require('express')
const router = express.Router()
const StudentFeeController = require('../controllers/studentFeeController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { enforceStudentScope } = require('../middlewares/scopeMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { 
  validateCreateStudentFee, 
  validateUpdateStudentFee,
  validateRecordPayment 
} = require('../validators/studentFeeValidator')

// Read-only access routes
router.get('/', verifyToken, requirePermission(PERMISSIONS.FEES_VIEW), StudentFeeController.getAllStudentFees)
router.get('/dashboard-stats', verifyToken, requirePermission(PERMISSIONS.FEES_VIEW), StudentFeeController.getDashboardStats)
router.get('/receipts', verifyToken, requirePermission(PERMISSIONS.FEES_VIEW), StudentFeeController.getReceipts)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.FEES_VIEW), enforceStudentScope, StudentFeeController.getStudentFeeById)

// Modification and collection routes
router.post('/', verifyToken, requirePermission(PERMISSIONS.FEES_COLLECT), validateCreateStudentFee, StudentFeeController.createStudentFee)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.FEES_UPDATE), validateUpdateStudentFee, StudentFeeController.updateStudentFee)
router.post('/:id/payments', verifyToken, requirePermission(PERMISSIONS.FEES_COLLECT), validateRecordPayment, StudentFeeController.addPayment)
router.delete('/bulk', verifyToken, requirePermission(PERMISSIONS.FEES_REFUND), StudentFeeController.bulkDeleteStudentFees)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.FEES_REFUND), StudentFeeController.deleteStudentFee)

module.exports = router
