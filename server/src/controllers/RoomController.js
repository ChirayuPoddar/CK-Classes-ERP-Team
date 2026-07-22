const RoomService = require('../services/RoomService')

class RoomController {
  async getAllRooms(req, res, next) {
    try {
      const rooms = await RoomService.getAllRooms({ ...req.query, tenantId: req.tenantId })
      res.status(200).json({
        success: true,
        message: 'Rooms retrieved successfully',
        data: rooms
      })
    } catch (error) {
      next(error)
    }
  }

  async getRoomById(req, res, next) {
    try {
      const room = await RoomService.getRoomById(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Room details retrieved successfully',
        data: room
      })
    } catch (error) {
      next(error)
    }
  }

  async createRoom(req, res, next) {
    try {
      const room = await RoomService.createRoom({ ...req.body, tenantId: req.tenantId })
      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: room
      })
    } catch (error) {
      next(error)
    }
  }

  async updateRoom(req, res, next) {
    try {
      const room = await RoomService.updateRoom(req.params.id, req.body, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Room updated successfully',
        data: room
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteRoom(req, res, next) {
    try {
      const room = await RoomService.deleteRoom(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Room deleted successfully',
        data: room
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new RoomController()
