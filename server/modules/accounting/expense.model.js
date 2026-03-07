const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category:    { type: String, required: true },
  amount:      { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  date:        { type: Date, required: true, default: Date.now },
  paidBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:      { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  paymentMethod:{ type: String, enum: ['cash','bank','card','upi'], default: 'bank' },
  receipt:     { type: String, default: '' },
  department:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);