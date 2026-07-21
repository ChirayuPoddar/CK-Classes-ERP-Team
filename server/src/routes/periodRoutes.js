const express = require('express')
const router = express.Router()
const PeriodController = require('../controllers/PeriodController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')

router.get('/', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), PeriodController.getAllPeriods)
router.get('/templates', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), PeriodController.getTemplates)
router.post('/bulk', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), PeriodController.bulkReplacePeriods)
router.post('/reorder', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), PeriodController.reorderPeriods)
router.post('/', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), PeriodController.createPeriod)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), PeriodController.updatePeriod)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), PeriodController.deletePeriod)

module.exports = router
