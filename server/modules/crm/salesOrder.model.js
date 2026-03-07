const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema({
  orderNumber:     { type: String, unique: true },
  customer:        { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [{
    product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:      String,
    quantity:  { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discount:  { type: Number, default: 0 },
    total:     Number,
  }],
  subtotal:        { type: Number, default: 0 },
  taxAmount:       { type: Number, default: 0 },
  discountAmount:  { type: Number, default: 0 },
  totalAmount:     { type: Number, default: 0 },
  status:          { type: String, enum: ['pending','processing','shipped','delivered','cancelled'], default: 'pending' },
  paymentStatus:   { type: String, enum: ['unpaid','partial','paid'], default: 'unpaid' },
  shippingAddress: { type: String, default: '' },
  notes:           { type: String, default: '' },
  assignedTo:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  warehouse:       { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
}, { timestamps: true });

salesOrderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const count = await mongoose.model('SalesOrder').countDocuments();
    this.orderNumber = `SO-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('SalesOrder', salesOrderSchema);