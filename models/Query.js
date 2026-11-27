const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  vendorId: { type: String, default: '' },
  vendorName: { type: String, default: '', trim: true },
  vendorEmail: { type: String, default: '', lowercase: true, trim: true },
  userName: { type: String, required: true, trim: true },
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  userPhone: { type: String, default: '', trim: true },
  eventType: { type: String, default: 'Wedding' },
  eventDate: { type: String, default: '' },
  guestCount: { type: Number, default: 200 },
  budget: { type: String, default: '' },
  message: { type: String, default: '' },
  vendorReply: { type: String, default: '', trim: true },
  repliedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Confirmed', 'Declined'],
    default: 'New'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Query = mongoose.models.Query || mongoose.model('Query', QuerySchema);

module.exports = { Query };
