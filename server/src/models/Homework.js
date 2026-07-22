const mongoose = require('mongoose')

const homeworkSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Homework title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Homework description is required'],
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject reference is required']
  },
  class: {
    type: String,
    required: [true, 'Class selection is required'],
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Overdue'],
    default: 'Pending'
  },
  attachment: {
    fileId: { type: String, default: '' },
    fileName: { type: String, default: '' },
    url: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    filePath: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: null }
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher reference is required']
  }
}, {
  timestamps: true
})

// Auto-derive overdue status in pre-save hook
homeworkSchema.pre('save', function(next) {
  const isOverdue = this.dueDate && new Date(this.dueDate) < new Date() && this.status !== 'Completed'
  if (isOverdue) {
    this.status = 'Overdue'
  }
  next()
})

module.exports = mongoose.model('Homework', homeworkSchema)
