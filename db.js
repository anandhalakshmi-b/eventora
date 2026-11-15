require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventora';
let isConnected = false;

// Local JSON fallback storage file
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const localDbFile = path.join(dataDir, 'local_db.json');

function getLocalDb() {
  try {
    if (fs.existsSync(localDbFile)) {
      return JSON.parse(fs.readFileSync(localDbFile, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local db file:', e.message);
  }
  return { users: [], invites: [] };
}

function saveLocalDb(data) {
  try {
    fs.writeFileSync(localDbFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving local db file:', e.message);
  }
}

async function connectDB() {
  if (rawUri.includes('<db_password>')) {
    console.log('\n--------------------------------------------------------------');
    console.log('📌 [MongoDB Atlas] Notice:');
    console.log('   The MONGODB_URI in your .env contains the placeholder "<db_password>".');
    console.log('   Please replace "<db_password>" with your actual MongoDB Atlas password in .env.');
    console.log('   In the meantime, resilient local persistent storage is active for all registrations and invites!');
    console.log('--------------------------------------------------------------\n');
    return false;
  }

  try {
    await mongoose.connect(rawUri, {
      serverSelectionTimeoutMS: 4000
    });
    isConnected = true;
    console.log('✅ [MongoDB] Connected successfully to:', rawUri.replace(/:([^:@]+)@/, ':****@'));
    return true;
  } catch (err) {
    isConnected = false;
    console.log('\n⚠️  [MongoDB] Connection note: ' + err.message);
    console.log('   Running in resilient mode with local persistent storage.\n');
    return false;
  }
}

module.exports = {
  connectDB,
  isMongooseConnected: () => isConnected,
  getLocalDb,
  saveLocalDb
};
