const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type:          { type: String, enum: ['in','out','transfer','adjustment'], required: true },
  quantity:      { type: Number, required: true, min: 1 },
  fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  toWarehouse:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  reference:     { type: String, default: '' },
  reason:        { type: String, default: '' },
  performedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);