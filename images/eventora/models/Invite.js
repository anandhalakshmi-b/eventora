const mongoose = require('mongoose');
const crypto = require('crypto');

const rsvpSchema = new mongoose.Schema({
  name: String, phone: String,
  status: { type: String, enum: ['Accepted', 'Declined'], default: 'Accepted' },
  count: { type: Number, default: 1 },
  dietary: String
}, { timestamps: true });

const inviteSchema = new mongoose.Schema({
  slug: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') }, // used in /e/:slug
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // link to teammate's Event when available
  template: { type: String, required: true },
  heading: String,
  title: { type: String, required: true, trim: true },
  hosts: String,
  date: Date,
  time: String,
  venue: String,
  address: String,
  dressCode: String,
  rsvpContact: String,
  message: String,
  fontFamily: { type: String, default: 'Playfair Display' },
  accent: String,   // user-chosen colour (hex)
  bg: String,
  photo: String,    // path under /uploads
  rsvps: [rsvpSchema] // fallback storage until the Guests module is merged
}, { timestamps: true });

module.exports = mongoose.models.Invite || mongoose.model('Invite', inviteSchema);
