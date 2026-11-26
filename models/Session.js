const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'vendor'],
    default: 'user'
  },
  eventType: {
    type: String,
    default: ''
  },
  eventName: {
    type: String,
    default: ''
  },
  eventDate: {
    type: String,
    default: ''
  },
  eventDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  eventBudget: {
    type: Number,
    default: 0
  },
  budgetData: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ total: 0, items: [] })
  },
  checklistData: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ tasks: [] })
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  }
});

const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

module.exports = { Session };
