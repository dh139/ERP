const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId:   { type: String, unique: true },
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department:   { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation:  { type: String, required: true },
  dateOfJoining:{ type: Date, required: true },
  employmentType:{ type: String, enum: ['full_time','part_time','contract'], default: 'full_time' },
  salary: {
    base:        { type: Number, default: 0 },
    hra:         { type: Number, default: 0 },
    allowances:  { type: Number, default: 0 },
    deductions:  { type: Number, default: 0 },
  },
  bankDetails: {
    bankName:    { type: String, default: '' },
    accountNo:   { type: String, default: '' },
    ifscCode:    { type: String, default: '' },
  },
  phone:        { type: String, default: '' },
  address:      { type: String, default: '' },
  documents:    [String],
  leaveBalance: {
    annual:     { type: Number, default: 12 },
    sick:       { type: Number, default: 6 },
    casual:     { type: Number, default: 6 },
  },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

employeeSchema.pre('save', async function () {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Employee', employeeSchema);