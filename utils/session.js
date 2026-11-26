const crypto = require('crypto');
const { Session } = require('../models/Session');
const { isMongooseConnected, ensureDB, getLocalDb, saveLocalDb } = require('../db');

const SESSION_COOKIE_NAME = 'eventora_sid';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function parseCookies(req) {
  const header = (req && req.headers && req.headers.cookie) || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx <= 0) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch (e) {
        out[key] = val;
      }
    }
  });
  return out;
}

function setSessionCookie(res, sessionId) {
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

async function createSession(user) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const record = {
    sessionId,
    userId: String(user.id || user._id || user.email),
    email: String(user.email || '').toLowerCase().trim(),
    name: String(user.name || ''),
    role: user.role === 'vendor' ? 'vendor' : 'user',
    eventType: String(user.eventType || ''),
    eventName: String(user.eventName || ''),
    eventDate: String(user.eventDate || ''),
    eventDetails: user.eventDetails && typeof user.eventDetails === 'object' ? user.eventDetails : {},
    eventBudget: Math.max(0, Number(user.eventBudget) || 0),
    budgetData: user.budgetData && typeof user.budgetData === 'object' ? user.budgetData : { total: Math.max(0, Number(user.eventBudget) || 0), items: [] },
    checklistData: user.checklistData && typeof user.checklistData === 'object' ? user.checklistData : { tasks: [] },
    createdAt: new Date(),
    expiresAt
  };

  const mongoReady = await ensureDB().catch(() => false);
  if (mongoReady && isMongooseConnected()) {
    try {
      await Session.create(record);
      return record;
    } catch (err) {
      console.warn('MongoDB session create fallback:', err.message);
    }
  }

  const db = getLocalDb();
  if (!Array.isArray(db.sessions)) db.sessions = [];
  db.sessions.push({
    ...record,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt.toISOString()
  });
  saveLocalDb(db);
  return record;
}

async function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const sid = cookies[SESSION_COOKIE_NAME];
  if (!sid) return null;

  const now = Date.now();
  const mongoReady = await ensureDB().catch(() => false);
  if (mongoReady && isMongooseConnected()) {
    try {
      const doc = await Session.findOne({ sessionId: sid }).lean();
      if (doc) {
        if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= now) {
          await Session.deleteOne({ sessionId: sid }).catch(() => {});
          return null;
        }
        return doc;
      }
    } catch (err) {
      console.warn('MongoDB session lookup fallback:', err.message);
    }
  }

  const db = getLocalDb();
  const sessions = Array.isArray(db.sessions) ? db.sessions : [];
  const match = sessions.find((s) => s.sessionId === sid);
  if (!match) return null;
  if (match.expiresAt && new Date(match.expiresAt).getTime() <= now) {
    db.sessions = sessions.filter((s) => s.sessionId !== sid);
    saveLocalDb(db);
    return null;
  }
  return match;
}

async function clearSessionByRequest(req, res) {
  const cookies = parseCookies(req);
  const sid = cookies[SESSION_COOKIE_NAME];

  if (sid) {
    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected()) {
      try {
        await Session.deleteOne({ sessionId: sid });
      } catch (err) {
        console.warn('MongoDB session delete error:', err.message);
      }
    }
    const db = getLocalDb();
    if (Array.isArray(db.sessions)) {
      db.sessions = db.sessions.filter((s) => s.sessionId !== sid);
      saveLocalDb(db);
    }
  }

  if (res) {
    clearSessionCookie(res);
  }
}

module.exports = {
  SESSION_COOKIE_NAME,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  createSession,
  getSessionFromRequest,
  clearSessionByRequest
};
