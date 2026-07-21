const express = require('express')
const router = express.Router()
const TimetableController = require('../controllers/TimetableController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')

router.get('/', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), TimetableController.getTimetableForClass)
router.get('/analytics', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), TimetableController.getAnalytics)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), TimetableController.getTimetableById)
router.post('/check-conflict', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), TimetableController.checkConflict)
router.post('/swap', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), TimetableController.swapSlots)
router.post('/bulk', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), TimetableController.bulkOperation)
router.post('/copy', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), TimetableController.copyTimetable)
router.post('/auto-generate', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), TimetableController.autoGenerate)
router.post('/', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), TimetableController.createTimetableSlot)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), TimetableController.updateTimetableSlot)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), TimetableController.deleteTimetableSlot)

module.exports = router
