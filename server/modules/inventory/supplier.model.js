const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  contactPerson:{ type: String, default: '' },
  email:        { type: String, default: '' },
  phone:        { type: String, default: '' },
  address:      { type: String, default: '' },
  paymentTerms: { type: String, default: 'Net 30' },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);