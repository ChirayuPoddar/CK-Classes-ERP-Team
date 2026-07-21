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
  },

  // ── Enterprise Extensions (all optional, backwards-compatible) ──

  section: {
    type: String,
    trim: true,
    default: ''
  },
  semester: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
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
  lectureType: {
    type: String,
    enum: ['Theory', 'Lab', 'Seminar', 'Workshop', 'Tutorial'],
    default: 'Theory'
  },
  credits: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    trim: true,
    default: ''
  },
  assistantTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  substituteTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  originalTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  isSubstituted: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1
  },
  templateId: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
})

// ── Compound indexes for performant conflict queries ──
timetableSchema.index({ day: 1, period: 1, teacher: 1, academicYear: 1 })
timetableSchema.index({ day: 1, period: 1, class: 1, academicYear: 1 })
timetableSchema.index({ day: 1, period: 1, room: 1, academicYear: 1 })
timetableSchema.index({ academicYear: 1, class: 1 })

module.exports = mongoose.model('Timetable', timetableSchema)
