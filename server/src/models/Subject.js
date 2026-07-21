const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema({
  subjectId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  class: {
    type: String,
    required: [true, 'Class selection is required'],
    trim: true
  },
  stream: {
    type: String,
    default: ''
  },
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: false
  },
  periodsPerWeek: {
    type: Number,
    required: [true, 'Periods per week is required'],
    min: [1, 'Periods per week must be at least 1']
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  description: {
    type: String,
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

// Auto-derive stream and auto-generate subjectId on pre-save hook in format SUB20260001
subjectSchema.pre('save', async function(next) {
  // 1. Derive stream based on class name
  if (this.class.includes('Science')) {
    this.stream = 'Science'
  } else if (this.class.includes('Commerce')) {
    this.stream = 'Commerce'
  } else {
    this.stream = ''
  }

  // 2. Generate subjectId
  if (!this.isNew) {
    return next()
  }

  try {
    const year = new Date().getFullYear()
    const prefix = `SUB${year}`
    
    const lastSubject = await mongoose.model('Subject').findOne(
      { subjectId: new RegExp(`^${prefix}`) },
      { subjectId: 1 },
      { sort: { subjectId: -1 } }
    )

    let nextSequence = 1
    if (lastSubject && lastSubject.subjectId) {
      const sequenceStr = lastSubject.subjectId.substring(prefix.length)
      const parsedSequence = parseInt(sequenceStr, 10)
      if (!isNaN(parsedSequence)) {
        nextSequence = parsedSequence + 1
      }
    }

    this.subjectId = `${prefix}${String(nextSequence).padStart(4, '0')}`
    next()
  } catch (err) {
    next(err)
  }
})

module.exports = mongoose.model('Subject', subjectSchema)
