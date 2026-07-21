const express = require('express')
const router = express.Router()
const PeriodController = require('../controllers/PeriodController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')

router.get('/', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), PeriodController.getAllPeriods)
router.post('/bulk', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), PeriodController.bulkReplacePeriods)

module.exports = router
