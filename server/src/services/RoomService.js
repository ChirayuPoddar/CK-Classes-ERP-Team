const Room = require('../models/Room')
const Timetable = require('../models/Timetable')

class RoomService {
  async getAllRooms(options = {}) {
    const query = { ...(options.tenantId ? { tenantId: options.tenantId } : {}) }
    if (options.status) query.status = options.status
    if (options.type) query.type = options.type
    if (options.building) query.building = options.building
    return await Room.find(query).sort({ name: 1 })
  }

  async getRoomById(id, tenantId) {
    const query = { _id: id, ...(tenantId ? { tenantId } : {}) }
    const room = await Room.findOne(query)
    if (!room) throw new Error('Room not found')
    return room
  }

  async createRoom(data) {
    const existing = await Room.findOne({ name: data.name.trim(), ...(data.tenantId ? { tenantId: data.tenantId } : {}) })
    if (existing) throw new Error(`Room with name "${data.name}" already exists`)
    const room = new Room(data)
    await room.save()
    return room
  }

  async updateRoom(id, data, tenantId = null) {
    const query = { _id: id, ...(tenantId ? { tenantId } : {}) }
    const room = await Room.findOne(query)
    if (!room) throw new Error('Room not found')
    
    if (data.name && data.name.trim() !== room.name) {
      const existing = await Room.findOne({ name: data.name.trim(), _id: { $ne: id }, ...(tenantId ? { tenantId } : {}) })
      if (existing) throw new Error(`Room with name "${data.name}" already exists`)
    }

    Object.assign(room, data)
    await room.save()
    return room
  }

  async deleteRoom(id, tenantId = null) {
    const query = { _id: id, ...(tenantId ? { tenantId } : {}) }
    const room = await Room.findOne(query)
    if (!room) throw new Error('Room not found')
    await Room.findOneAndDelete(query)
    return room
  }
}

module.exports = new RoomService()
