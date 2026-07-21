const mongoose = require('mongoose')

const periodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Period / Break name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['period', 'break', 'lunch', 'short_break'],
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
  },

  // ── Enterprise Extensions ──

  duration: {
    type: Number // in minutes, auto-calculated from start/end
  },
  templateName: {
    type: String,
    default: 'Default',
    trim: true
  },
  applicableClasses: [{
    type: String,
    trim: true
  }], // empty array = applies to all classes
  applicableDays: [{
    type: String,
    trim: true
  }] // empty array = applies to all days, enables Saturday-only configs
}, {
  timestamps: true
})

// Auto-calculate duration before save
periodSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    const parseTime = (tStr) => {
      const match = (tStr || '').trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i)
      if (!match) return 0
      let hrs = parseInt(match[1], 10)
      const mins = parseInt(match[2], 10)
      const ampm = match[3].toUpperCase()
      if (ampm === 'PM' && hrs !== 12) hrs += 12
      if (ampm === 'AM' && hrs === 12) hrs = 0
      return hrs * 60 + mins
    }
    const start = parseTime(this.startTime)
    const end = parseTime(this.endTime)
    if (end > start) {
      this.duration = end - start
    }
  }
  next()
})

module.exports = mongoose.model('Period', periodSchema)
