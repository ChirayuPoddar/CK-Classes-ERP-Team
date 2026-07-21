const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message body is required'],
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [250, 'Description cannot exceed 250 characters']
  },
  audience: {
    type: [String],
    required: [true, 'Target audience is required'],
    enum: [
      'Entire Institute', 
      'Specific Class', 
      'Specific Subject', 
      'Teachers Only', 
      'Students Only', 
      'Parents Only', 
      'Admin Only'
    ]
  },
  class: {
    type: String,
    trim: true,
    default: ''
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null
  },
  targetClasses: {
    type: [String],
    default: []
  },
  targetSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  publishAt: {
    type: Date,
    required: [true, 'Publish date and time is required']
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  attachments: [{
    fileId: { type: String, default: '' },
    fileName: { type: String, default: '' },
    url: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    filePath: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: null }
  }],
  status: {
    type: String,
    enum: ['Scheduled', 'Published'],
    default: 'Published'
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  acknowledgedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Auto-recalculate status before saving
announcementSchema.pre('save', function(next) {
  const now = new Date()
  if (this.publishAt && new Date(this.publishAt) > now) {
    this.status = 'Scheduled'
  } else {
    this.status = 'Published'
  }

  // Keep targetClasses and targetSubjects array properties in sync with singular values
  if (this.class) {
    this.targetClasses = [this.class]
  } else {
    this.targetClasses = []
  }

  if (this.subject) {
    this.targetSubjects = [this.subject]
  } else {
    this.targetSubjects = []
  }

  next()
})

module.exports = mongoose.model('Announcement', announcementSchema)
