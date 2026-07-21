const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
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
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  parentPhone: {
    type: String,
    trim: true
  },
  parentEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'India'
  },
  pincode: {
    type: String,
    trim: true
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
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  religion: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relation: {
      type: String,
      trim: true
    }
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated'],
    default: 'Active'
  },
  parent: {
    type: String,
    trim: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  occupation: {
    type: String,
    trim: true
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

// Auto-generate studentId on pre-save hook in format CK20260001
studentSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next()
  }

  try {
    const year = new Date().getFullYear()
    const prefix = `CK${year}`
    
    // Find the last student with studentId starting with prefix
    const lastStudent = await mongoose.model('Student').findOne(
      { studentId: new RegExp(`^${prefix}`) },
      { studentId: 1 },
      { sort: { studentId: -1 } }
    )

    let nextSequence = 1
    if (lastStudent && lastStudent.studentId) {
      const sequenceStr = lastStudent.studentId.substring(prefix.length)
      const parsedSequence = parseInt(sequenceStr, 10)
      if (!isNaN(parsedSequence)) {
        nextSequence = parsedSequence + 1
      }
    }

    this.studentId = `${prefix}${String(nextSequence).padStart(4, '0')}`
    next()
  } catch (err) {
    next(err)
  }
})

const Student = mongoose.model('Student', studentSchema)
module.exports = Student
