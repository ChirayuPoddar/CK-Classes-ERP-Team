const express = require('express')
const router = express.Router()
const TeacherController = require('../controllers/TeacherController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { validateCreateTeacher, validateUpdateTeacher } = require('../validators/teacherValidator')
const { uploadPhoto } = require('../middlewares/uploadMiddleware')

router.get('/', verifyToken, requirePermission(PERMISSIONS.TEACHERS_VIEW), TeacherController.getAllTeachers)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.TEACHERS_VIEW), TeacherController.getTeacherById)

router.post('/', verifyToken, requirePermission(PERMISSIONS.TEACHERS_CREATE), validateCreateTeacher, TeacherController.createTeacher)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.TEACHERS_UPDATE), validateUpdateTeacher, TeacherController.updateTeacher)
router.delete('/bulk', verifyToken, requirePermission(PERMISSIONS.TEACHERS_DELETE), TeacherController.bulkDeleteTeachers)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.TEACHERS_DELETE), TeacherController.deleteTeacher)

router.post('/:id/photo', verifyToken, requirePermission(PERMISSIONS.TEACHERS_UPDATE), uploadPhoto.single('photo'), TeacherController.uploadTeacherPhoto)
router.delete('/:id/photo', verifyToken, requirePermission(PERMISSIONS.TEACHERS_UPDATE), TeacherController.deleteTeacherPhoto)

module.exports = router
