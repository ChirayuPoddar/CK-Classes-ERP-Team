const mongoose = require('mongoose')

const attendanceSettingsSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  attendanceThreshold: {
    type: Number,
    default: 75,
    min: 0,
    max: 100
  },
  lateThreshold: {
    type: Number,
    default: 15 // in minutes
  },
  attendanceLockTime: {
    type: Number,
    default: 24 // in hours
  },
  defaultStatus: {
    type: String,
    enum: ['Present', 'Absent', 'Pending'],
    default: 'Present'
  },
  weekendAttendance: {
    type: Boolean,
    default: false
  },
  autoLockAttendance: {
    type: Boolean,
    default: false
  },
  enableRemarks: {
    type: Boolean,
    default: true
  },
  enableLeave: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('AttendanceSettings', attendanceSettingsSchema)
