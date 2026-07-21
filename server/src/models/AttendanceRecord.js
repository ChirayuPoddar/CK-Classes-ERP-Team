const mongoose = require('mongoose')

const attendanceRecordSchema = new mongoose.Schema({
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
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Present', 'Absent', 'Late', 'Leave']
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  markedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound index to prevent duplicate attendance record for same student in same session
attendanceRecordSchema.index({ attendanceSessionId: 1, studentId: 1 }, { unique: true })

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema)
