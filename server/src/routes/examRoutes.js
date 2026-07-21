const express = require('express')
const router = express.Router()
const ExamController = require('../controllers/ExamController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { enforceStudentScope } = require('../middlewares/scopeMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { 
  validateCreateExam, 
  validateUpdateExam 
} = require('../validators/examValidator')

// Read-only access routes
router.get('/', verifyToken, requirePermission(PERMISSIONS.EXAMS_VIEW), ExamController.getAllExams)
router.get('/dashboard-stats', verifyToken, requirePermission(PERMISSIONS.EXAMS_VIEW), ExamController.getDashboardStats)
router.get('/results', verifyToken, requirePermission(PERMISSIONS.EXAMS_VIEW), ExamController.queryAllResults)
router.get('/results/me', verifyToken, requirePermission(PERMISSIONS.EXAMS_VIEW), ExamController.getMyResults)
router.get('/results/student/:studentId', verifyToken, requirePermission(PERMISSIONS.EXAMS_VIEW), enforceStudentScope, ExamController.getStudentResults)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.EXAMS_VIEW), ExamController.getExamById)

// CRUD modification routes
router.post('/', verifyToken, requirePermission(PERMISSIONS.EXAMS_CREATE), validateCreateExam, ExamController.createExam)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.EXAMS_UPDATE), validateUpdateExam, ExamController.updateExam)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.EXAMS_CREATE), ExamController.deleteExam)

// Marks Entry routes
router.get('/:examId/students', verifyToken, requirePermission(PERMISSIONS.EXAMS_MARKS), ExamController.getStudentsForMarksEntry)
router.post('/:examId/marks', verifyToken, requirePermission(PERMISSIONS.EXAMS_MARKS), ExamController.saveMarks)

module.exports = router
