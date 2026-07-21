const express = require('express')
const router = express.Router()
const HomeworkController = require('../controllers/homeworkController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { uploadDocument } = require('../middlewares/uploadMiddleware')
const { 
  validateCreateHomework, 
  validateUpdateHomework 
} = require('../validators/homeworkValidator')

router.get('/', verifyToken, requirePermission(PERMISSIONS.HOMEWORK_VIEW), HomeworkController.getAllHomeworks)
router.get('/dashboard-stats', verifyToken, requirePermission(PERMISSIONS.HOMEWORK_VIEW), HomeworkController.getDashboardStats)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.HOMEWORK_VIEW), HomeworkController.getHomeworkById)

router.post('/', verifyToken, requirePermission(PERMISSIONS.HOMEWORK_CREATE), uploadDocument.single('attachment'), validateCreateHomework, HomeworkController.createHomework)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.HOMEWORK_UPDATE), uploadDocument.single('attachment'), validateUpdateHomework, HomeworkController.updateHomework)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.HOMEWORK_DELETE), HomeworkController.deleteHomework)

module.exports = router
