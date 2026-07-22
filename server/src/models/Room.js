const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true
  },
  capacity: {
    type: Number,
    default: 40,
    min: [1, 'Capacity must be at least 1']
  },
  building: {
    type: String,
    trim: true,
    default: ''
  },
  floor: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    enum: ['Classroom', 'Lab', 'Seminar Hall', 'Workshop', 'Smart Classroom'],
    default: 'Classroom'
  },
  facilities: {
    projector: { type: Boolean, default: false },
    ac: { type: Boolean, default: false },
    smartBoard: { type: Boolean, default: false },
    computerLab: { type: Boolean, default: false }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Inactive'],
    default: 'Active'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
})

roomSchema.index({ tenantId: 1, name: 1 }, { unique: true })
roomSchema.index({ tenantId: 1, building: 1, floor: 1 })
roomSchema.index({ tenantId: 1, status: 1 })

module.exports = mongoose.model('Room', roomSchema)
