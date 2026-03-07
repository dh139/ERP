const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, default: '' },
  phone:       { type: String, default: '' },
  company:     { type: String, default: '' },
  address:     { type: String, default: '' },
  creditLimit: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpent:  { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

customerSchema.index({ name: 'text', email: 'text', company: 'text' });

module.exports = mongoose.model('Customer', customerSchema);