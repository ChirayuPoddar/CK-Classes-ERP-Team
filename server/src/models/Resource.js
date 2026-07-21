const mongoose = require('mongoose')

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  resourceType: {
    type: String,
    enum: ['PDF', 'Document', 'Presentation', 'Spreadsheet', 'Image', 'Video', 'ZIP', 'External Link', 'YouTube Video', 'Cloud Video'],
    required: true
  },
  fileType: {
    type: String,
    trim: true
  },
  resourceUrl: {
    type: String,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  youtubeId: {
    type: String,
    trim: true
  },
  cloudPublicId: {
    type: String,
    trim: true
  },
  externalUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  publishAt: {
    type: Date,
    required: [true, 'Publish date and time is required']
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Published'],
    default: 'Published'
  },
  visibility: {
    type: String,
    enum: ['Entire Institute', 'Specific Class', 'Specific Subject', 'Teachers Only'],
    required: true
  },
  class: {
    type: String,
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  targetClasses: [{
    type: String
  }],
  targetSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  fileName: {
    type: String,
    trim: true
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  lastViewedAt: {
    type: Date
  },
  classAnalytics: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
})

// Auto-recalculate status and sync target arrays before saving
resourceSchema.pre('save', function(next) {
  const now = new Date()
  if (this.publishAt && new Date(this.publishAt) > now) {
    this.status = 'Scheduled'
  } else {
    this.status = 'Published'
  }

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

module.exports = mongoose.model('Resource', resourceSchema)
