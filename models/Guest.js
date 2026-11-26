const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  ownerEmail: {
    type: String,
    default: '',
    lowercase: true,
    trim: true,
    index: true
  },
  eventName: {
    type: String,
    default: 'Eventora Celebration'
  },
  eventDate: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: '',
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  group: {
    type: String,
    default: '',
    trim: true
  },
  diet: {
    type: String,
    default: '',
    trim: true
  },
  plus: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined'],
    default: 'Pending'
  },
  source: {
    type: String,
    enum: ['host', 'rsvp'],
    default: 'host'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Guest = mongoose.models.Guest || mongoose.model('Guest', GuestSchema);

module.exports = { Guest };
