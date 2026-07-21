const express = require('express')
const router = express.Router()
const FeeStructureController = require('../controllers/feeStructureController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { validateCreateFeeStructure, validateUpdateFeeStructure } = require('../validators/feeStructureValidator')

// Read-only access routes
router.get('/', verifyToken, requirePermission(PERMISSIONS.FEES_VIEW), FeeStructureController.getAllFeeStructures)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.FEES_VIEW), FeeStructureController.getFeeStructureById)

// Modification routes
router.post('/', verifyToken, requirePermission(PERMISSIONS.FEES_UPDATE), validateCreateFeeStructure, FeeStructureController.createFeeStructure)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.FEES_UPDATE), validateUpdateFeeStructure, FeeStructureController.updateFeeStructure)
router.delete('/bulk', verifyToken, requirePermission(PERMISSIONS.FEES_UPDATE), FeeStructureController.bulkDeleteFeeStructures)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.FEES_UPDATE), FeeStructureController.deleteFeeStructure)

module.exports = router
