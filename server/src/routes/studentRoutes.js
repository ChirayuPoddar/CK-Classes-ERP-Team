const express = require('express')
const router = express.Router()
const StudentController = require('../controllers/StudentController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { enforceStudentScope } = require('../middlewares/scopeMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { validateCreateStudent, validateUpdateStudent } = require('../validators/studentValidator')
const { uploadPhoto, uploadDocument } = require('../middlewares/uploadMiddleware')

// Route: Search students
router.get('/search', verifyToken, requirePermission(PERMISSIONS.STUDENTS_VIEW), StudentController.searchStudents)

// Route: Get students by class
router.get('/class/:className', verifyToken, requirePermission(PERMISSIONS.STUDENTS_VIEW), StudentController.getStudentsByClass)

// Route: Upload / Replace profile photo
router.post('/:id/photo', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), uploadPhoto.single('photo'), StudentController.uploadStudentPhoto)

// Route: Delete profile photo
router.delete('/:id/photo', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), StudentController.deleteStudentPhoto)

// Route: Get promotion candidate count
router.get('/promote/count', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), StudentController.getPromotionCount)

// Route: Promote students to new grade
router.post('/promote', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), StudentController.promoteStudents)

// Route: Bulk update student status
router.put('/bulk/status', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), StudentController.bulkUpdateStatus)

// Route: Create student profile
router.post('/', verifyToken, requirePermission(PERMISSIONS.STUDENTS_CREATE), validateCreateStudent, StudentController.createStudent)

// Route: Get all paginated, sorted, and filtered students
router.get('/', verifyToken, requirePermission(PERMISSIONS.STUDENTS_VIEW), StudentController.getAllStudents)

// Route: Get single student by ID (protected against IDOR)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.STUDENTS_VIEW), enforceStudentScope, StudentController.getStudentById)

// Route: Update student profile
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), validateUpdateStudent, StudentController.updateStudent)

// Route: Bulk delete students
router.delete('/bulk', verifyToken, requirePermission(PERMISSIONS.STUDENTS_DELETE), StudentController.bulkDeleteStudents)

// Route: Soft-delete student profile
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.STUDENTS_DELETE), StudentController.deleteStudent)

// Route: Restore soft-deleted student profile
router.patch('/:id/restore', verifyToken, requirePermission(PERMISSIONS.STUDENTS_DELETE), StudentController.restoreStudent)

// Route: Toggle Portal Access
router.put('/:id/portal-access', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), StudentController.togglePortalAccess)

// Route: Upload student document
router.post('/:id/documents', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), uploadDocument.single('document'), StudentController.uploadDocument)

// Route: Delete student document
router.delete('/:id/documents/:docId', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), StudentController.deleteDocument)

// Route: Add internal staff note
router.post('/:id/notes', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), StudentController.addInternalNote)

// Route: Delete internal staff note
router.delete('/:id/notes/:noteId', verifyToken, requirePermission(PERMISSIONS.STUDENTS_UPDATE), StudentController.deleteInternalNote)

module.exports = router
