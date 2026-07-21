const mongoose = require('mongoose')

const timetableVersionSchema = new mongoose.Schema({
  timetableSlotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable',
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'swap', 'bulk', 'restore', 'auto_generate'],
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  academicYear: {
    type: String,
    trim: true,
    default: '2026-2027'
  },
  class: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
})

timetableVersionSchema.index({ timetableSlotId: 1, version: -1 })
timetableVersionSchema.index({ academicYear: 1, class: 1, changedAt: -1 })

module.exports = mongoose.model('TimetableVersion', timetableVersionSchema)
