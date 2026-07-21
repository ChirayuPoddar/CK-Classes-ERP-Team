const mongoose = require('mongoose')

const attendanceSessionSchema = new mongoose.Schema({
  timetableSlotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable',
    required: [true, 'Timetable slot ID is required']
  },
  classId: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject reference is required']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher reference is required']
  },
  periodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Period',
    required: [true, 'Period reference is required']
  },
  day: {
    type: String,
    required: [true, 'Day is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Submitted', 'Completed', 'Locked', 'Overridden', 'Pending'],
    default: 'Completed'
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Compound index to prevent duplicate attendance session for same timetable slot on same date
attendanceSessionSchema.index({ timetableSlotId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema)
