const Room = require('../models/Room')
const Timetable = require('../models/Timetable')

class RoomService {
  async getAllRooms(options = {}) {
    const query = {}
    if (options.status) query.status = options.status
    if (options.type) query.type = options.type
    if (options.building) query.building = options.building
    return await Room.find(query).sort({ name: 1 })
  }

  async getRoomById(id) {
    const room = await Room.findById(id)
    if (!room) throw new Error('Room not found')
    return room
  }

  async createRoom(data) {
    const existing = await Room.findOne({ name: data.name.trim() })
    if (existing) throw new Error(`Room with name "${data.name}" already exists`)
    const room = new Room(data)
    await room.save()
    return room
  }

  async updateRoom(id, data) {
    const room = await Room.findById(id)
    if (!room) throw new Error('Room not found')
    
    if (data.name && data.name.trim() !== room.name) {
      const existing = await Room.findOne({ name: data.name.trim() })
      if (existing) throw new Error(`Room with name "${data.name}" already exists`)
    }

    Object.assign(room, data)
    await room.save()
    return room
  }

  async deleteRoom(id) {
    const room = await Room.findById(id)
    if (!room) throw new Error('Room not found')
    await Room.findByIdAndDelete(id)
    return room
  }
}

module.exports = new RoomService()
