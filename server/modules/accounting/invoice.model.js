const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  salesOrder:    { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  items: [{
    name:      String,
    quantity:  Number,
    unitPrice: Number,
    taxRate:   { type: Number, default: 0 },
    total:     Number,
  }],
  subtotal:      { type: Number, default: 0 },
  taxAmount:     { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  totalAmount:   { type: Number, default: 0 },
  amountPaid:    { type: Number, default: 0 },
  balanceDue:    { type: Number, default: 0 },
  status:        { type: String, enum: ['draft','sent','partial','paid','overdue'], default: 'draft' },
  dueDate:       { type: Date },
  paidOn:        { type: Date },
  notes:         { type: String, default: '' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

invoiceSchema.pre('save', async function () {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);