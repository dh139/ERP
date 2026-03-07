const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:        { type: Date, required: true },
  checkIn:     { type: String, default: '' },
  checkOut:    { type: String, default: '' },
  status:      { type: String, enum: ['present','absent','half_day','leave','holiday'], default: 'present' },
  hoursWorked: { type: Number, default: 0 },
  notes:       { type: String, default: '' },
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);