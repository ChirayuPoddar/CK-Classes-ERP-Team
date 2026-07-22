const mongoose = require('mongoose')

const attendanceOverrideHistorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  attendanceSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: [true, 'Attendance session reference is required'],
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required'],
    index: true
  },
  oldStatus: {
    type: String,
    required: true
  },
  newStatus: {
    type: String,
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Override reason is required'],
    trim: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('AttendanceOverrideHistory', attendanceOverrideHistorySchema)
