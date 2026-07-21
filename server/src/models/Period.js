const mongoose = require('mongoose')

const periodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Period / Break name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['period', 'break'],
    default: 'period'
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'Order index is required']
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Period', periodSchema)
