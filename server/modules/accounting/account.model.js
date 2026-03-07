const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true },
  name:        { type: String, required: true, trim: true },
  type:        { type: String, enum: ['asset','liability','equity','revenue','expense'], required: true },
  parentAccount:{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  description: { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
  balance:     { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);