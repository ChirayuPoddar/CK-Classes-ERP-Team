const mongoose = require('mongoose')

const timetableSchema = new mongoose.Schema({
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true
  },
  day: {
    type: String,
    required: [true, 'Day is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    trim: true
  },
  period: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Period',
    required: [true, 'Period reference is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: false
  },
  room: {
    type: String,
    trim: true,
    default: ''
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  academicYear: {
    type: String,
    default: '2026-2027',
    trim: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Timetable', timetableSchema)
