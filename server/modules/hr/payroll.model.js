const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month:        { type: Number, required: true },
  year:         { type: Number, required: true },
  workingDays:  { type: Number, default: 26 },
  presentDays:  { type: Number, default: 26 },
  earnings: {
    basic:      { type: Number, default: 0 },
    hra:        { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
  },
  deductions: {
    tax:        { type: Number, default: 0 },
    providentFund:{ type: Number, default: 0 },
    other:      { type: Number, default: 0 },
    unpaidLeave:{ type: Number, default: 0 },
  },
  grossSalary:  { type: Number, default: 0 },
  totalDeductions:{ type: Number, default: 0 },
  netSalary:    { type: Number, default: 0 },
  status:       { type: String, enum: ['draft','processed','paid'], default: 'draft' },
  paidOn:       { type: Date },
  processedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);