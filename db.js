require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Disable command buffering so queries never hang when disconnected
mongoose.set('bufferCommands', false);

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
  return { users: [], invites: [], queries: [] };
}

function saveLocalDb(data) {
  try {
    fs.writeFileSync(localDbFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving local db file:', e.message);
  }
}

let connectPromise = null;

async function connectDB() {
  if (connectPromise) return connectPromise;

  if (rawUri.includes('<db_password>')) {
    console.log('\n--------------------------------------------------------------');
    console.log('📌 [MongoDB Atlas] Notice:');
    console.log('   The MONGODB_URI contains placeholder "<db_password>".');
    console.log('   In the meantime, resilient local persistent storage is active for all registrations and invites!');
    console.log('--------------------------------------------------------------\n');
    isConnected = false;
    return false;
  }

  connectPromise = (async () => {
    try {
      await mongoose.connect(rawUri, {
        serverSelectionTimeoutMS: 1500,
        connectTimeoutMS: 1500,
        socketTimeoutMS: 3000
      });
      isConnected = mongoose.connection.readyState === 1;
      if (isConnected) {
        console.log('✅ [MongoDB] Connected successfully to:', rawUri.replace(/:([^:@]+)@/, ':****@'));
      }
      return isConnected;
    } catch (err) {
      isConnected = false;
      try { await mongoose.disconnect(); } catch (e) {}
      console.log('\n⚠️  [MongoDB] Connection note: ' + err.message);
      console.log('   Running in resilient mode with local persistent storage.\n');
      return false;
    }
  })();

  return connectPromise;
}

async function ensureDB() {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }
  if (connectPromise) {
    await connectPromise;
  }
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  ensureDB,
  isMongooseConnected: () => isConnected && mongoose.connection.readyState === 1,
  getLocalDb,
  saveLocalDb
};
