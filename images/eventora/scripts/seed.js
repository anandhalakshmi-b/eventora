require('dotenv').config();
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const ConsultantRequest = require('../models/ConsultantRequest');
const ConsultationPlan = require('../models/ConsultationPlan');
const Invite = require('../models/Invite');

const planId = new mongoose.Types.ObjectId('672000000000000000000001');
const chatSessionId = 'eventora-demo-session';

const records = [
  {
    model: ConsultationPlan,
    document: {
      _id: planId,
      eventType: 'wedding',
      eventDate: new Date('2027-02-14T00:00:00.000Z'),
      guests: 150,
      budget: 1500000,
      city: 'Mumbai',
      style: 'Traditional',
      timeline: [
        { when: '6 months before', task: 'Book the venue and caterer' },
        { when: '1 month before', task: 'Send invitations and confirm guest count' },
        { when: 'Event week', task: 'Confirm vendors and final arrangements' }
      ],
      venueTypes: ['Banquet hall', 'Lawn / farmhouse'],
      vendorCategories: ['Caterer', 'Photographer', 'Decorator'],
      budgetSplit: [
        { category: 'Venue', percent: 25, amount: 375000 },
        { category: 'Catering', percent: 30, amount: 450000 },
        { category: 'Decor & Flowers', percent: 12, amount: 180000 },
        { category: 'Photography & Video', percent: 8, amount: 120000 },
        { category: 'Outfits & Jewellery', percent: 12, amount: 180000 },
        { category: 'Music & Entertainment', percent: 5, amount: 75000 },
        { category: 'Invites & Gifts', percent: 4, amount: 60000 },
        { category: 'Miscellaneous', percent: 4, amount: 60000 }
      ],
      decor: ['Marigold and jasmine mandap', 'Rangoli entrance'],
      saved: true
    }
  },
  {
    model: ConsultantRequest,
    document: {
      _id: new mongoose.Types.ObjectId('672000000000000000000002'),
      name: 'Demo Customer',
      phone: '9000000000',
      email: 'demo@example.com',
      preferredTime: 'Afternoon',
      notes: 'Sample consultation request',
      plan: planId,
      status: 'New'
    }
  },
  {
    model: Invite,
    document: {
      _id: new mongoose.Types.ObjectId('672000000000000000000003'),
      slug: 'eventora-demo-wedding',
      template: 'wedding',
      heading: 'Shubh Vivah',
      title: 'Aarav & Meera',
      hosts: 'Together with their families',
      date: new Date('2027-02-14T00:00:00.000Z'),
      time: '6:00 PM',
      venue: 'The Garden Hall',
      address: 'Mumbai',
      rsvpContact: '9000000000',
      message: 'Join us to celebrate our wedding.',
      accent: '#DC2626',
      bg: '#FEE2E2'
    }
  },
  {
    model: ChatMessage,
    document: {
      _id: new mongoose.Types.ObjectId('672000000000000000000004'),
      sessionId: chatSessionId,
      role: 'user',
      text: 'Help me plan a small wedding.',
      source: 'rules'
    }
  },
  {
    model: ChatMessage,
    document: {
      _id: new mongoose.Types.ObjectId('672000000000000000000005'),
      sessionId: chatSessionId,
      role: 'ora',
      text: 'Start with your date, guest count, budget, and venue. I can help organize the next steps.',
      source: 'rules'
    }
  }
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventora');

    const results = await Promise.all(records.map(({ model, document }) =>
      model.updateOne(
        { _id: document._id },
        { $setOnInsert: document },
        { upsert: true }
      )
    ));
    const inserted = results.reduce((total, result) => total + result.upsertedCount, 0);
    console.log(`Seed complete: added ${inserted} sample records; existing records were left unchanged.`);
  } catch (error) {
    console.error('Database seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Database disconnect failed:', error.message);
  process.exitCode = 1;
});
