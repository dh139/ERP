const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse:    { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity:     { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 10 },
}, { timestamps: true });

stockSchema.index({ product: 1, warehouse: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);