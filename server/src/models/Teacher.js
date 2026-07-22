const mongoose = require('mongoose')

const teacherSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  teacherId: {
    type: String,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  phone: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  qualification: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: Number,
    required: true,
    default: 0
  },
  subjects: {
    type: [String],
    default: []
  },
  salary: {
    type: Number,
    required: true,
    default: 0
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    trim: true
  },
  emergencyPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  photo: {
    public_id: {
      type: String,
      default: ''
    },
    secure_url: {
      type: String,
      default: ''
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Auto-generate teacherId on pre-save hook in format TCH20260001 if not explicitly provided
teacherSchema.pre('save', async function(next) {
  if (!this.isNew || Boolean(this.teacherId)) {
    return next()
  }

  try {
    const year = new Date().getFullYear()
    const prefix = `TCH${year}`
    
    // Find the last teacher with teacherId starting with prefix scoped to this tenant
    const lastTeacher = await mongoose.model('Teacher').findOne(
      { tenantId: this.tenantId, teacherId: new RegExp(`^${prefix}`) },
      { teacherId: 1 },
      { sort: { teacherId: -1 } }
    )

    let nextSequence = 1
    if (lastTeacher && lastTeacher.teacherId) {
      const sequenceStr = lastTeacher.teacherId.substring(prefix.length)
      const parsedSequence = parseInt(sequenceStr, 10)
      if (!isNaN(parsedSequence)) {
        nextSequence = parsedSequence + 1
      }
    }

    this.teacherId = `${prefix}${String(nextSequence).padStart(4, '0')}`
    next()
  } catch (err) {
    next(err)
  }
})

teacherSchema.index({ tenantId: 1, teacherId: 1 }, { unique: true })
teacherSchema.index({ tenantId: 1, phone: 1 }, { unique: true })
teacherSchema.index({ tenantId: 1, email: 1 }, { unique: true })

const Teacher = mongoose.model('Teacher', teacherSchema)
module.exports = Teacher
