const express = require('express')
const router = express.Router()
const RoomController = require('../controllers/RoomController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')

router.get('/', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), RoomController.getAllRooms)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_VIEW), RoomController.getRoomById)
router.post('/', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), RoomController.createRoom)
router.put('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), RoomController.updateRoom)
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.TIMETABLE_MANAGE), RoomController.deleteRoom)

module.exports = router
