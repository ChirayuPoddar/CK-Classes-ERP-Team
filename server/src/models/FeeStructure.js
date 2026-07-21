const mongoose = require('mongoose')

const feeStructureSchema = new mongoose.Schema({
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true
  },
  tuitionFee: {
    type: Number,
    required: [true, 'Tuition fee is required'],
    min: [0, 'Tuition fee must be at least 0']
  },
  transportFee: {
    type: Number,
    required: [true, 'Transport fee is required'],
    min: [0, 'Transport fee must be at least 0']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('FeeStructure', feeStructureSchema)
