const mongoose = require('mongoose')

const attendanceAuditLogSchema = new mongoose.Schema({
  attendanceSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    index: true
  },
  action: {
    type: String,
    enum: ['Created', 'Edited', 'Override', 'Locked', 'Unlocked', 'Deleted'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('AttendanceAuditLog', attendanceAuditLogSchema)
