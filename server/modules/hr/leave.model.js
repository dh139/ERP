const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType:  { type: String, enum: ['annual','sick','casual','unpaid'], required: true },
  fromDate:   { type: Date, required: true },
  toDate:     { type: Date, required: true },
  days:       { type: Number, required: true },
  reason:     { type: String, default: '' },
  status:     { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appliedOn:  { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);