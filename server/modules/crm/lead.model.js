const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, default: '' },
  phone:       { type: String, default: '' },
  company:     { type: String, default: '' },
  source:      { type: String, enum: ['website','referral','cold_call','social_media','other'], default: 'other' },
  status:      { type: String, enum: ['new','contacted','qualified','lost','converted'], default: 'new' },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  followUpDate:{ type: Date },
  notes:       { type: String, default: '' },
  value:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);