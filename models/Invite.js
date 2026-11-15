const mongoose = require('mongoose');

const InviteSchema = new mongoose.Schema({
  slug: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: String,
    default: 'guest'
  },
  template: {
    type: String,
    default: 'kanjivaram'
  },
  heading: {
    type: String,
    default: '॥ ஓம் ஸ்ரீ கணேசாய நமஹ ॥'
  },
  title: {
    type: String,
    required: true
  },
  hosts: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    default: ''
  },
  venue: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  dressCode: {
    type: String,
    default: 'Traditional Pattu Veshti / Kanjivaram Silk'
  },
  rsvpContact: {
    type: String,
    default: ''
  },
  feastDetails: {
    type: String,
    default: 'Traditional Banana Leaf Kalyana Virundhu & Filter Kaapi'
  },
  compliments: {
    type: String,
    default: 'With Best Compliments from Family & Friends'
  },
  accent: {
    type: String,
    default: '#D4AF37'
  },
  bg: {
    type: String,
    default: '#7F1D1D'
  },
  fontFamily: {
    type: String,
    default: 'Playfair Display'
  },
  photoUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Invite = mongoose.models.Invite || mongoose.model('Invite', InviteSchema);

module.exports = { Invite };
