const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'ora'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  source: {
    type: String,
    default: 'rules'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

module.exports = { ChatMessage };
