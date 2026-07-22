const mongoose = require('mongoose');

const promotionHistorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  studentId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  oldClass: {
    type: String,
    required: true
  },
  newClass: {
    type: String,
    required: true
  },
  promotionDate: {
    type: Date,
    default: Date.now
  },
  promotedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PromotionHistory', promotionHistorySchema);
