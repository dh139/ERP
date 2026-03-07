const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  category:     { type: String, required: true },
  brand:        { type: String, default: '' },
  unit:         { type: String, default: 'pcs' },
  costPrice:    { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  taxRate:      { type: Number, default: 0 },
  barcode:      { type: String, default: '' },
  images:       [String],
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ sku: 1 });
productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);