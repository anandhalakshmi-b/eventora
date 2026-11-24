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
    description: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    portfolio: [{
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      image: { type: String, default: '' },
      link: { type: String, default: '' }
    }],
    pictures: [{ type: String }]
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

function hashPasswordAsync(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPasswordAsync(password, storedHash) {
  return new Promise((resolve) => {
    if (!storedHash || !storedHash.includes(':')) return resolve(false);
    const [salt, originalHash] = storedHash.split(':');
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) return resolve(false);
      resolve(derivedKey.toString('hex') === originalHash);
    });
  });
}

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = {
  User,
  hashPassword,
  verifyPassword,
  hashPasswordAsync,
  verifyPasswordAsync
};
