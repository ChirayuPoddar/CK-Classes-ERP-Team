const express = require('express')
const router = express.Router()
const ResourceController = require('../controllers/ResourceController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { uploadResource } = require('../middlewares/uploadMiddleware')
const { validateCreateResource, validateUpdateResource } = require('../validators/resourceValidator')

// Read-only paths
router.get('/', verifyToken, requirePermission(PERMISSIONS.RESOURCES_VIEW), ResourceController.getAllResources)
router.get('/dashboard-stats', verifyToken, requirePermission(PERMISSIONS.RESOURCES_VIEW), ResourceController.getDashboardStats)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.RESOURCES_VIEW), ResourceController.getResourceById)
router.post('/:id/download', verifyToken, requirePermission(PERMISSIONS.RESOURCES_VIEW), ResourceController.incrementDownload)
router.post('/:id/view', verifyToken, requirePermission(PERMISSIONS.RESOURCES_VIEW), ResourceController.incrementView)

// CRUD modification paths
router.post('/', verifyToken, requirePermission(PERMISSIONS.RESOURCES_CREATE), uploadResource.single('file'), validateCreateResource, ResourceController.createResource)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.RESOURCES_UPDATE), uploadResource.single('file'), validateUpdateResource, ResourceController.updateResource)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.RESOURCES_DELETE), ResourceController.deleteResource)

// Star / Duplicate paths
router.patch('/:id/star', verifyToken, requirePermission(PERMISSIONS.RESOURCES_UPDATE), ResourceController.toggleStar)
router.post('/:id/duplicate', verifyToken, requirePermission(PERMISSIONS.RESOURCES_CREATE), ResourceController.duplicateResource)

// Bulk operations
router.post('/bulk-delete', verifyToken, requirePermission(PERMISSIONS.RESOURCES_DELETE), ResourceController.bulkDelete)
router.post('/bulk-update', verifyToken, requirePermission(PERMISSIONS.RESOURCES_UPDATE), ResourceController.bulkUpdate)
router.post('/bulk-zip', verifyToken, requirePermission(PERMISSIONS.RESOURCES_VIEW), ResourceController.bulkZip)

module.exports = router
