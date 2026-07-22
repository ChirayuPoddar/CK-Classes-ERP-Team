const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  receiptNo: {
    type: String,
    required: true,
    default: () => 'REC-' + Math.floor(100000 + Math.random() * 900000)
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Cheque', 'Bank Transfer'],
    default: 'Cash'
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  collectedBy: {
    type: String,
    default: 'Admin'
  },
  notes: {
    type: String,
    trim: true
  }
})

const studentFeeSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required']
  },
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: [true, 'Fee structure reference is required']
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
  totalFee: {
    type: Number,
    required: [true, 'Total fee is required'],
    min: [0, 'Total fee must be at least 0']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount must be at least 0']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['Paid', 'Partial', 'Unpaid', 'Overdue'],
    default: 'Unpaid'
  },
  payments: [paymentSchema]
}, {
  timestamps: true
})

// Auto-derive status from totalFee, paidAmount, and dueDate on pre-save hook
studentFeeSchema.pre('save', function(next) {
  const total = this.totalFee || 0
  const paid = this.paidAmount || 0
  const pending = total - paid
  const isOverdue = this.dueDate && new Date(this.dueDate) < new Date()

  if (pending <= 0) {
    this.status = 'Paid'
  } else if (isOverdue) {
    this.status = 'Overdue'
  } else if (paid > 0) {
    this.status = 'Partial'
  } else {
    this.status = 'Unpaid'
  }
  next()
})

module.exports = mongoose.model('StudentFee', studentFeeSchema)
