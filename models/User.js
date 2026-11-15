const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'vendor'],
    default: 'user'
  },
  city: {
    type: String,
    trim: true,
    default: 'Chennai'
  },
  eventType: {
    type: String,
    default: 'Tamil Thirumanam'
  },
  eventDate: {
    type: String,
    default: ''
  },
  guestCount: {
    type: Number,
    default: 200
  },
  vendorDetails: {
    businessName: { type: String, default: '' },
    category: { type: String, default: '' },
    price: { type: String, default: '' },
    services: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = {
  User,
  hashPassword,
  verifyPassword
};
