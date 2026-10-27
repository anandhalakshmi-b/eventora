const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, match: /^[6-9]\d{9}$/ }, // Indian mobile number
  email: { type: String, required: true, trim: true, lowercase: true },
  preferredTime: String,
  notes: String,
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsultationPlan' },
  status: { type: String, enum: ['New', 'Contacted', 'Closed'], default: 'New' }
}, { timestamps: true });

module.exports = mongoose.models.ConsultantRequest || mongoose.model('ConsultantRequest', requestSchema);
