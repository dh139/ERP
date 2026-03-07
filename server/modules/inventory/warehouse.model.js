const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  location: { type: String, required: true },
  manager:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  capacity: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);