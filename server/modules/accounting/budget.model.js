const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  department:      { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  fiscalYear:      { type: Number, required: true },
  month:           { type: Number, required: true },
  allocatedAmount: { type: Number, required: true, default: 0 },
  spentAmount:     { type: Number, default: 0 },
  category:        { type: String, default: 'General' },
}, { timestamps: true });

budgetSchema.index({ department: 1, fiscalYear: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);