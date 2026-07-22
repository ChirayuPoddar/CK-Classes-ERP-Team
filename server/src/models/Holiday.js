const mongoose = require('mongoose')

const holidaySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Holiday name is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Holiday date is required']
  },
  endDate: {
    type: Date // for multi-day events like Exam Week
  },
  type: {
    type: String,
    enum: ['National', 'School', 'Exam Week', 'Sports Day', 'Festival', 'Event'],
    default: 'School'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  academicYear: {
    type: String,
    default: '2026-2027',
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  affectedClasses: [{
    type: String,
    trim: true
  }] // empty = affects all classes
}, {
  timestamps: true
})

holidaySchema.index({ tenantId: 1, date: 1, academicYear: 1 })
holidaySchema.index({ tenantId: 1, type: 1 })

module.exports = mongoose.model('Holiday', holidaySchema)
