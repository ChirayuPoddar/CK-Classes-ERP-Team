const mongoose = require('mongoose')

const examSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  class: {
    type: String,
    required: [true, 'Class selection is required'],
    trim: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  maxMarks: {
    type: Number,
    required: [true, 'Maximum marks is required'],
    min: [1, 'Maximum marks must be greater than 0']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [0, 'Passing marks cannot be negative']
  },
  instructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Scheduled', 'Active', 'Completed', 'Published'],
    default: 'Scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: {
    type: Date
  },
  lockedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Database performance search indexes
examSchema.index({ examName: 1, academicYear: 1, class: 1, subjectId: 1, isDeleted: 1 }, { unique: true })
examSchema.index({ class: 1 })
examSchema.index({ subjectId: 1 })
examSchema.index({ status: 1 })
examSchema.index({ academicYear: 1 })
examSchema.index({ isDeleted: 1 })
examSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Exam', examSchema)
