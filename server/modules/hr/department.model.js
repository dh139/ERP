const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true, trim: true },
  manager:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  budget:     { type: Number, default: 0 },
  headcount:  { type: Number, default: 0 },
  description:{ type: String, default: '' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);