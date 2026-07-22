const express = require('express')
const router = express.Router()
const HolidayController = require('../controllers/HolidayController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')

router.get('/', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), HolidayController.getAllHolidays)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), HolidayController.getHolidayById)
router.post('/', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), HolidayController.createHoliday)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), HolidayController.updateHoliday)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), HolidayController.deleteHoliday)

module.exports = router
