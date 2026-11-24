const mongoose = require('mongoose');
const crypto = require('crypto');

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // business name
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  city: { type: String, default: 'Chennai' },
  role: { type: String, enum: ['vendor'], default: 'vendor' },
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
  createdAt: { type: Date, default: Date.now }
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

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

module.exports = { Vendor, hashPassword, verifyPassword };