const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber:  { type: String, unique: true },
  supplier:  { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items: [{
    product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity:  { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total:     { type: Number },
  }],
  status:      { type: String, enum: ['draft','ordered','received','cancelled'], default: 'draft' },
  totalAmount: { type: Number, default: 0 },
  notes:       { type: String, default: '' },
  orderedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receivedAt:  { type: Date },
}, { timestamps: true });

// Auto-generate PO number
purchaseOrderSchema.pre('save', async function () {
  if (!this.poNumber) {
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    this.poNumber = `PO-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);