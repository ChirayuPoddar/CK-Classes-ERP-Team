const mongoose = require('mongoose')

const examMarkSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam reference is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required']
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject reference is required']
  },
  marksObtained: {
    type: Number,
    required: [true, 'Marks obtained is required'],
    min: [0, 'Marks obtained cannot be negative']
  },
  maxMarks: {
    type: Number,
    required: [true, 'Maximum marks is required'],
    min: [0, 'Maximum marks cannot be negative']
  },
  percentage: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  result: {
    type: String,
    enum: ['PASS', 'FAIL'],
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Database performance search indexes
examMarkSchema.index({ tenantId: 1, examId: 1, studentId: 1, isDeleted: 1 }, { unique: true })
examMarkSchema.index({ studentId: 1 })
examMarkSchema.index({ subjectId: 1 })
examMarkSchema.index({ examId: 1 })
examMarkSchema.index({ isDeleted: 1 })
examMarkSchema.index({ createdAt: -1 })

module.exports = mongoose.model('ExamMark', examMarkSchema)
