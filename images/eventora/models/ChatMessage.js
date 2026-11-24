const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sessionId: { type: String, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['user', 'ora'], required: true },
  text: { type: String, required: true },
  source: { type: String, enum: ['claude', 'rules'], default: 'rules' }
}, { timestamps: true });

module.exports = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatSchema);
