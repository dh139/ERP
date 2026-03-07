const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txnNumber:   { type: String, unique: true },
  date:        { type: Date, required: true, default: Date.now },
  description: { type: String, required: true },
  entries: [{
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    debit:   { type: Number, default: 0 },
    credit:  { type: Number, default: 0 },
  }],
  reference:   { type: String, default: '' },
  type:        { type: String, enum: ['manual','sale','purchase','payroll','expense'], default: 'manual' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

transactionSchema.pre('save', async function () {
  if (!this.txnNumber) {
    const count = await mongoose.model('Transaction').countDocuments();
    this.txnNumber = `TXN-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);