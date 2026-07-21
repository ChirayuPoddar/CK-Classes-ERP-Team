const express = require('express')
const router = express.Router()
const SubjectController = require('../controllers/subjectController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { validateCreateSubject, validateUpdateSubject } = require('../validators/subjectValidator')

router.get('/', verifyToken, requirePermission(PERMISSIONS.SUBJECTS_VIEW), SubjectController.getAllSubjects)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.SUBJECTS_VIEW), SubjectController.getSubjectById)

router.post('/', verifyToken, requirePermission(PERMISSIONS.SUBJECTS_MANAGE), validateCreateSubject, SubjectController.createSubject)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.SUBJECTS_MANAGE), validateUpdateSubject, SubjectController.updateSubject)
router.delete('/bulk', verifyToken, requirePermission(PERMISSIONS.SUBJECTS_MANAGE), SubjectController.bulkDeleteSubjects)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.SUBJECTS_MANAGE), SubjectController.deleteSubject)

module.exports = router
