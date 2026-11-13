const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // set after login module is merged
  eventType: String,
  eventDate: Date,
  guests: Number,
  budget: Number, // in INR
  city: String,
  style: String,
  timeline: [{ when: String, task: String }],
  venueTypes: [String],
  vendorCategories: [String],
  budgetSplit: [{ category: String, percent: Number, amount: Number }],
  decor: [String],
  saved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.ConsultationPlan || mongoose.model('ConsultationPlan', planSchema);
