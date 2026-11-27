const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { User, hashPasswordAsync, verifyPasswordAsync } = require('../models/User');
const { Invite } = require('../models/Invite');
const { Query } = require('../models/Query');
const { Guest } = require('../models/Guest');
const { Session } = require('../models/Session');
const { isMongooseConnected, ensureDB, getLocalDb, saveLocalDb } = require('../db');
const {
  createSession,
  setSessionCookie,
  clearSessionByRequest,
  getSessionFromRequest
} = require('../utils/session');
const { handleChatRequest } = require('../utils/chatbot');

// ==========================================
// 1. AUTHENTICATION & USER REGISTRATION
// ==========================================

function normalizeRegisteredEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const eventType = String(raw.eventType || '').trim();
  const eventDate = String(raw.eventDate || '').trim();
  const explicitName = String(raw.eventName || '').trim();
  const d = raw.eventDetails && typeof raw.eventDetails === 'object' ? raw.eventDetails : {};

  const eventDetails = {};
  [
    'brideName', 'groomName', 'partner1Name', 'partner2Name',
    'honoreeName', 'milestone', 'parentsName', 'babyName',
    'hostName', 'companyName', 'collegeName', 'eventTitle'
  ].forEach((k) => {
    if (d[k] !== undefined && String(d[k]).trim()) {
      eventDetails[k] = String(d[k]).trim();
    }
  });

  if (!eventType && !explicitName && !eventDate && Object.keys(eventDetails).length === 0) {
    return null;
  }

  let eventName = explicitName;
  if (!eventName) {
    const t = eventType.toLowerCase();
    if (t.includes('wedding')) {
      if (eventDetails.brideName && eventDetails.groomName) {
        eventName = `${eventDetails.brideName} & ${eventDetails.groomName}'s Wedding`;
      } else if (eventDetails.brideName || eventDetails.groomName) {
        eventName = `${eventDetails.brideName || eventDetails.groomName}'s Wedding`;
      } else {
        eventName = 'Wedding Celebration';
      }
    } else if (t.includes('engagement')) {
      if (eventDetails.brideName && eventDetails.groomName) {
        eventName = `${eventDetails.brideName} & ${eventDetails.groomName}'s Engagement`;
      } else {
        eventName = 'Engagement Celebration';
      }
    } else if (t.includes('anniversary')) {
      if (eventDetails.partner1Name && eventDetails.partner2Name) {
        eventName = `${eventDetails.partner1Name} & ${eventDetails.partner2Name}'s Anniversary`;
      } else {
        eventName = 'Anniversary Celebration';
      }
    } else if (t.includes('birthday')) {
      if (eventDetails.honoreeName) {
        const ms = eventDetails.milestone ? ` ${eventDetails.milestone}` : '';
        eventName = `${eventDetails.honoreeName}'s${ms} Birthday`;
      } else {
        eventName = 'Birthday Celebration';
      }
    } else if (t.includes('baby shower')) {
      const n = eventDetails.honoreeName || eventDetails.parentsName;
      eventName = n ? `${n}'s Baby Shower` : 'Baby Shower';
    } else if (t.includes('naming')) {
      const n = eventDetails.babyName || eventDetails.parentsName;
      eventName = n ? `${n}'s Naming Ceremony` : 'Naming Ceremony';
    } else if (t.includes('housewarming')) {
      eventName = eventDetails.hostName ? `${eventDetails.hostName}'s Housewarming` : 'Housewarming Celebration';
    } else if (t.includes('corporate')) {
      eventName = [eventDetails.eventTitle, eventDetails.companyName].filter(Boolean).join(' - ') || 'Corporate & Team Event';
    } else if (t.includes('college') || t.includes('graduation')) {
      eventName = [eventDetails.eventTitle, eventDetails.collegeName].filter(Boolean).join(' - ') || 'College & Graduation Event';
    } else if (t.includes('festival')) {
      eventName = [eventDetails.eventTitle, eventDetails.hostName].filter(Boolean).join(' - ') || 'Festival Celebration';
    } else {
      eventName = eventDetails.eventTitle || eventDetails.honoreeName || eventDetails.hostName || eventType || 'Celebration';
    }
  }

  const rawBudget = raw.eventBudget !== undefined ? Number(raw.eventBudget) : 0;
  const eventBudget = Number.isFinite(rawBudget) && rawBudget >= 0 ? rawBudget : 0;

  return {
    eventType: eventType || 'Wedding',
    eventName,
    eventDate,
    eventDetails,
    eventBudget
  };
}

function formatUserResponse(user) {
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    city: user.city || 'Chennai',
    eventType: user.eventType || '',
    eventName: user.eventName || '',
    eventDate: user.eventDate || '',
    eventDetails: user.eventDetails || {},
    eventBudget: Number(user.eventBudget) || 0,
    guestCount: user.guestCount || 200,
    vendorDetails: user.vendorDetails || {}
  };
}

// Register a new user or vendor
router.post('/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone = '',
      role = 'user',
      city = 'Chennai',
      eventType = '',
      eventDate = '',
      guestCount = 200,
      businessName = '',
      category = '',
      price = '',
      services = '',
      description = '',
      portfolioUrl = '',
      portfolio = [],
      pictures = []
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const cleanPhone = String(phone || '').trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'A valid 10-digit phone number is required.'
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanRole = role === 'vendor' ? 'vendor' : 'user';
    const [mongoReady, passwordHash] = await Promise.all([
      ensureDB().catch(() => false),
      hashPasswordAsync(password)
    ]);

    const vendorDetails = {
      businessName: String(businessName || name).trim(),
      category: String(category || '').trim(),
      price: String(price || '').trim(),
      services: String(services || '').trim(),
      description: String(description || '').trim(),
      portfolioUrl: String(portfolioUrl || '').trim(),
      portfolio: Array.isArray(portfolio) ? portfolio : [],
      pictures: Array.isArray(pictures) ? pictures : []
    };

    if (mongoReady && isMongooseConnected()) {
      try {
        const existingUser = await User.findOne({ email: cleanEmail }).select('_id').maxTimeMS(3000).lean();
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists.'
          });
        }

        const newUser = new User({
          name: String(name).trim(),
          email: cleanEmail,
          password: passwordHash,
          phone: String(phone || '').trim(),
          role: cleanRole,
          city: String(city || 'Chennai').trim(),
          eventType,
          eventDate,
          guestCount: Number(guestCount) || 200,
          vendorDetails
        });

        await newUser.save();
        const formatted = formatUserResponse(newUser);
        const session = await createSession(formatted);
        setSessionCookie(res, session.sessionId);

        return res.status(201).json({
          success: true,
          message: 'Registration successful! Saved to MongoDB.',
          sessionId: session.sessionId,
          user: formatted
        });
      } catch (mongoErr) {
        if (mongoErr && mongoErr.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists.'
          });
        }
        console.warn('MongoDB register fallback:', mongoErr.message);
      }
    }

    // Local fallback storage
    const db = getLocalDb();
    if (!db.users) db.users = [];

    const existing = db.users.find(u => u.email === cleanEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const mockId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const userDoc = {
      _id: mockId,
      id: mockId,
      name: String(name).trim(),
      email: cleanEmail,
      password: passwordHash,
      phone: String(phone || '').trim(),
      role: cleanRole,
      city: String(city || 'Chennai').trim(),
      eventType,
      eventDate,
      guestCount: Number(guestCount) || 200,
      vendorDetails,
      createdAt: new Date().toISOString()
    };

    db.users.push(userDoc);
    saveLocalDb(db);

    const formatted = formatUserResponse(userDoc);
    const session = await createSession(formatted);
    setSessionCookie(res, session.sessionId);

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      sessionId: session.sessionId,
      user: formatted
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration: ' + err.message
    });
  }
});

// Login user
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, registerEvent } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const normalizedEvent = normalizeRegisteredEvent(registerEvent);
    const mongoReady = await ensureDB().catch(() => false);

    if (mongoReady && isMongooseConnected()) {
      try {
        let user = await User.findOne({ email: cleanEmail }).maxTimeMS(3000).lean();
        if (user) {
          const ok = await verifyPasswordAsync(password, user.password);
          if (!ok) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
          }
          if (normalizedEvent && user.role !== 'vendor') {
            try {
              const updated = await User.findByIdAndUpdate(
                user._id,
                { $set: normalizedEvent },
                { returnDocument: 'after' }
              ).lean();
              if (updated) user = updated;
            } catch (upErr) {
              user = { ...user, ...normalizedEvent };
            }
          }
          const formatted = formatUserResponse(user);
          const session = await createSession(formatted);
          setSessionCookie(res, session.sessionId);
          return res.json({
            success: true,
            message: 'Login successful!',
            sessionId: session.sessionId,
            user: formatted
          });
        }
      } catch (mongoErr) {
        console.warn('MongoDB login fallback:', mongoErr.message);
      }
    }

    const db = getLocalDb();
    const localUser = (db.users || []).find(u => u.email === cleanEmail);
    if (localUser) {
      const ok = await verifyPasswordAsync(password, localUser.password);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      if (normalizedEvent && localUser.role !== 'vendor') {
        Object.assign(localUser, normalizedEvent);
        saveLocalDb(db);
      }
      const formatted = formatUserResponse(localUser);
      const session = await createSession(formatted);
      setSessionCookie(res, session.sessionId);
      return res.json({
        success: true,
        message: 'Login successful!',
        sessionId: session.sessionId,
        user: formatted
      });
    }

    // Built-in quick demo accounts if not yet created in DB
    if (cleanEmail === 'demo@eventora.com' && password === 'Eventora123!') {
      const demoUser = {
        id: 'eventora-demo-user',
        name: 'Eventora Demo User',
        email: cleanEmail,
        phone: '+91 98401 00000',
        role: 'user',
        city: 'Chennai',
        eventType: normalizedEvent ? normalizedEvent.eventType : '',
        eventName: normalizedEvent ? normalizedEvent.eventName : '',
        eventDate: normalizedEvent ? normalizedEvent.eventDate : '',
        eventDetails: normalizedEvent ? normalizedEvent.eventDetails : {}
      };
      const session = await createSession(demoUser);
      setSessionCookie(res, session.sessionId);
      return res.json({
        success: true,
        message: 'Demo login successful!',
        sessionId: session.sessionId,
        user: demoUser
      });
    }
    if (cleanEmail === 'vendor.demo@eventora.com' && password === 'Vendor123!') {
      const demoVendor = {
        id: 'eventora-demo-vendor',
        name: 'Meera Nair',
        email: cleanEmail,
        phone: '+91 98401 23456',
        role: 'vendor',
        city: 'Madurai',
        vendorDetails: {
          businessName: 'Glow by Meera Bridal Studio',
          category: 'Makeup & Styling',
          price: '8000',
          services: 'Bridal makeup, Hair styling, Saree draping',
          description: 'Bridal and occasion makeup with a personal consultation and trial session.',
          portfolio: [],
          pictures: ['images/makeup/1.jpg', 'images/makeup/2.jpg']
        }
      };
      const session = await createSession(demoVendor);
      setSessionCookie(res, session.sessionId);
      return res.json({
        success: true,
        message: 'Vendor demo login successful!',
        sessionId: session.sessionId,
        user: demoVendor
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Logout user & clear session cookie
router.post('/auth/logout', async (req, res) => {
  try {
    await clearSessionByRequest(req, res);
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
});

// Verify active session cookie
router.get('/auth/me', async (req, res) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ success: false, authenticated: false });
    }

    const mongoReady = await ensureDB().catch(() => false);
    let user = null;
    if (mongoReady && isMongooseConnected()) {
      user = await User.findOne({ email: session.email }).select('-password').maxTimeMS(2500).lean();
    }
    if (!user) {
      const db = getLocalDb();
      user = (db.users || []).find((u) => u.email === session.email);
    }

    const safeUser = user
      ? formatUserResponse(user)
      : {
          id: session.userId,
          name: session.name || session.email,
          email: session.email,
          role: session.role || 'user',
          eventType: session.eventType || '',
          eventName: session.eventName || '',
          eventDate: session.eventDate || '',
          eventDetails: session.eventDetails || {},
          eventBudget: Number(session.eventBudget) || 0
        };

    return res.json({
      success: true,
      authenticated: true,
      sessionId: session.sessionId,
      user: safeUser
    });
  } catch (err) {
    console.error('Auth check error:', err);
    return res.status(500).json({ success: false, authenticated: false });
  }
});

function getMinEventDateStr() {
  const dt = new Date();
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + 2);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Register or update event details for the logged-in customer
router.put('/auth/event', async (req, res) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const normalizedEvent = normalizeRegisteredEvent(req.body);
    if (!normalizedEvent) {
      return res.status(400).json({ success: false, message: 'Event type and details are required.' });
    }

    const minDateStr = getMinEventDateStr();
    const rawDate = String(normalizedEvent.eventDate || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || rawDate < minDateStr) {
      return res.status(400).json({
        success: false,
        message: `Event date must be at least 2 days in the future (on or after ${minDateStr}).`
      });
    }

    const budgetUpdate = {
      ...normalizedEvent,
      budgetData: { total: normalizedEvent.eventBudget, items: [] }
    };

    const mongoReady = await ensureDB().catch(() => false);
    let updatedUser = null;

    if (mongoReady && isMongooseConnected()) {
      updatedUser = await User.findOneAndUpdate(
        { email: session.email },
        { $set: budgetUpdate },
        { returnDocument: 'after' }
      ).select('-password').lean();

      await Session.updateMany(
        { sessionId: session.sessionId },
        { $set: budgetUpdate }
      ).catch(() => {});

      await Guest.updateMany(
        { ownerEmail: session.email },
        { $set: { eventName: normalizedEvent.eventName, eventDate: normalizedEvent.eventDate, updatedAt: new Date() } }
      ).catch(() => {});
    }

    const db = getLocalDb();
    if (!updatedUser) {
      const localUser = (db.users || []).find((u) => u.email === session.email);
      if (localUser) {
        Object.assign(localUser, budgetUpdate);
        updatedUser = localUser;
      }
    }
    if (Array.isArray(db.guests)) {
      db.guests.forEach((g) => {
        if ((g.ownerEmail || '').toLowerCase() === session.email) {
          g.eventName = normalizedEvent.eventName;
          g.eventDate = normalizedEvent.eventDate;
        }
      });
    }
    if (Array.isArray(db.sessions)) {
      db.sessions.forEach((s) => {
        if (s.sessionId === session.sessionId) {
          Object.assign(s, budgetUpdate);
        }
      });
    }
    saveLocalDb(db);

    const safeUser = updatedUser
      ? formatUserResponse(updatedUser)
      : {
          id: session.userId,
          name: session.name || session.email,
          email: session.email,
          role: session.role || 'user',
          city: 'Chennai',
          ...normalizedEvent
        };

    return res.json({
      success: true,
      message: 'Event registered successfully!',
      user: safeUser
    });
  } catch (err) {
    console.error('Register user event error:', err);
    return res.status(500).json({ success: false, message: 'Could not save event details.' });
  }
});

// Shared helper to read/write per-user MongoDB state (budgetData / checklistData)
async function readUserPlannerField(session, fieldName, fallbackValue) {
  const mongoReady = await ensureDB().catch(() => false);
  if (mongoReady && isMongooseConnected()) {
    const user = await User.findOne({ email: session.email }).select(`${fieldName} eventBudget`).lean();
    if (user && user[fieldName] && typeof user[fieldName] === 'object') {
      return { value: user[fieldName], eventBudget: Number(user.eventBudget) || 0 };
    }
    const sess = await Session.findOne({ sessionId: session.sessionId }).select(`${fieldName} eventBudget`).lean();
    if (sess && sess[fieldName] && typeof sess[fieldName] === 'object') {
      return { value: sess[fieldName], eventBudget: Number(sess.eventBudget) || 0 };
    }
  }
  const db = getLocalDb();
  const localUser = (db.users || []).find((u) => u.email === session.email);
  if (localUser && localUser[fieldName]) {
    return { value: localUser[fieldName], eventBudget: Number(localUser.eventBudget) || 0 };
  }
  const localSess = (db.sessions || []).find((s) => s.sessionId === session.sessionId);
  if (localSess && localSess[fieldName]) {
    return { value: localSess[fieldName], eventBudget: Number(localSess.eventBudget) || 0 };
  }
  return { value: fallbackValue, eventBudget: Number(session.eventBudget) || 0 };
}

async function writeUserPlannerField(session, extraSet) {
  const mongoReady = await ensureDB().catch(() => false);
  if (mongoReady && isMongooseConnected()) {
    await User.findOneAndUpdate(
      { email: session.email },
      { $set: extraSet },
      { returnDocument: 'after' }
    ).catch(() => {});
    await Session.updateMany(
      { sessionId: session.sessionId },
      { $set: extraSet }
    ).catch(() => {});
  }
  const db = getLocalDb();
  const localUser = (db.users || []).find((u) => u.email === session.email);
  if (localUser) Object.assign(localUser, extraSet);
  if (Array.isArray(db.sessions)) {
    db.sessions.forEach((s) => {
      if (s.sessionId === session.sessionId) Object.assign(s, extraSet);
    });
  }
  saveLocalDb(db);
}

// Per-user Budget endpoints
router.get('/budget', async (req, res) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const { value, eventBudget } = await readUserPlannerField(session, 'budgetData', { total: 0, items: [] });
    const items = Array.isArray(value.items) ? value.items : [];
    const total = value.total !== undefined ? Math.max(0, Number(value.total) || 0) : eventBudget;

    return res.json({
      success: true,
      eventBudget,
      data: { total, items }
    });
  } catch (err) {
    console.error('Get budget error:', err);
    return res.status(500).json({ success: false, message: 'Could not load budget.' });
  }
});

router.put('/budget', async (req, res) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const body = req.body || {};
    const total = Math.max(0, Number(body.total) || 0);
    const items = Array.isArray(body.items)
      ? body.items.map((i) => ({
          id: String(i.id || Math.random().toString(36).slice(2, 9)),
          cat: String(i.cat || 'Other').trim(),
          est: Math.max(0, Number(i.est) || 0),
          act: Math.max(0, Number(i.act) || 0)
        }))
      : [];

    const budgetData = { total, items };
    await writeUserPlannerField(session, { budgetData, eventBudget: total });

    return res.json({ success: true, data: budgetData });
  } catch (err) {
    console.error('Save budget error:', err);
    return res.status(500).json({ success: false, message: 'Could not save budget.' });
  }
});

// Per-user Checklist endpoints
router.get('/checklist', async (req, res) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const { value } = await readUserPlannerField(session, 'checklistData', { tasks: [] });
    const tasks = Array.isArray(value.tasks) ? value.tasks : [];

    return res.json({ success: true, data: { tasks } });
  } catch (err) {
    console.error('Get checklist error:', err);
    return res.status(500).json({ success: false, message: 'Could not load checklist.' });
  }
});

router.put('/checklist', async (req, res) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const body = req.body || {};
    const tasks = Array.isArray(body.tasks) ? body.tasks : [];
    const checklistData = { tasks };
    await writeUserPlannerField(session, { checklistData });

    return res.json({ success: true, data: checklistData });
  } catch (err) {
    console.error('Save checklist error:', err);
    return res.status(500).json({ success: false, message: 'Could not save checklist.' });
  }
});

// ==========================================
// 2. INVITATIONS & DIGITAL CARDS
// ==========================================

// Create / Save an invitation card
router.post('/invites', async (req, res) => {
  try {
    const session = await getSessionFromRequest(req).catch(() => null);
    const data = req.body || {};
    const slug = data.slug || ('invite-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6));
    const ownerId = (session && (session.email || session.userId)) || data.userId || 'guest';

    const inviteData = {
      slug,
      userId: ownerId,
      template: data.template || 'wedding',
      heading: data.heading || 'Celebration Invitation',
      title: data.title || 'Event Celebration',
      hosts: data.hosts || '',
      date: data.date || '',
      time: data.time || '',
      venue: data.venue || '',
      address: data.address || '',
      message: data.message || '',
      dressCode: data.dressCode || 'Traditional Festive or Formal Attire',
      rsvpContact: data.rsvpContact || '',
      feastDetails: data.feastDetails || 'Traditional Celebration Banquet & Refreshments',
      compliments: data.compliments || 'With Best Compliments from Family & Friends',
      accent: data.accent || '#D4AF37',
      bg: data.bg || '#7F1D1D',
      fontFamily: data.fontFamily || 'Playfair Display',
      photoUrl: data.photoUrl || ''
    };

    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected()) {
      const newInvite = new Invite(inviteData);
      await newInvite.save();

      return res.status(201).json({
        success: true,
        message: 'Invitation saved to MongoDB successfully!',
        data: newInvite
      });
    } else {
      const db = getLocalDb();
      if (!db.invites) db.invites = [];

      const mockId = 'inv_' + Date.now();
      const savedDoc = {
        _id: mockId,
        id: mockId,
        ...inviteData,
        createdAt: new Date().toISOString()
      };

      db.invites.unshift(savedDoc);
      saveLocalDb(db);

      return res.status(201).json({
        success: true,
        message: 'Invitation saved! (Stored in local database)',
        data: savedDoc
      });
    }
  } catch (err) {
    console.error('Save invite error:', err);
    return res.status(500).json({ success: false, message: 'Could not save invitation: ' + err.message });
  }
});

// Get invitations for the logged-in user
router.get('/invites', async (req, res) => {
  try {
    const session = await getSessionFromRequest(req).catch(() => null);
    const ownerKeys = session ? [session.email, session.userId].filter(Boolean) : [];
    const mongoReady = await ensureDB().catch(() => false);

    if (mongoReady && isMongooseConnected()) {
      const filter = ownerKeys.length ? { userId: { $in: ownerKeys } } : {};
      const invites = await Invite.find(filter).sort({ createdAt: -1 }).limit(50);
      return res.json({ success: true, data: invites });
    } else {
      const db = getLocalDb();
      let list = db.invites || [];
      if (ownerKeys.length) {
        list = list.filter((x) => ownerKeys.includes(x.userId));
      }
      return res.json({ success: true, data: list });
    }
  } catch (err) {
    console.error('Fetch invites error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching invitations.' });
  }
});

// Get single invitation by ID or slug
router.get('/invites/:idOrSlug', async (req, res) => {
  try {
    const idOrSlug = req.params.idOrSlug;
    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected()) {
      let invite = null;
      if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
        invite = await Invite.findById(idOrSlug);
      }
      if (!invite) {
        invite = await Invite.findOne({ slug: idOrSlug });
      }
      if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found.' });
      return res.json({ success: true, data: invite });
    } else {
      const db = getLocalDb();
      const invite = (db.invites || []).find(x => x._id === idOrSlug || x.id === idOrSlug || x.slug === idOrSlug);
      if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found.' });
      return res.json({ success: true, data: invite });
    }
  } catch (err) {
    console.error('Get invite error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving invitation.' });
  }
});

// Delete invitation
router.delete('/invites/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const session = await getSessionFromRequest(req).catch(() => null);
    const ownerKeys = session ? [session.email, session.userId].filter(Boolean) : [];
    const mongoReady = await ensureDB().catch(() => false);

    if (mongoReady && isMongooseConnected()) {
      const filter = ownerKeys.length ? { _id: id, userId: { $in: ownerKeys } } : { _id: id };
      await Invite.findOneAndDelete(filter);
      return res.json({ success: true, message: 'Invitation deleted from MongoDB.' });
    } else {
      const db = getLocalDb();
      db.invites = (db.invites || []).filter(x => !(x._id === id || x.id === id) || (ownerKeys.length && !ownerKeys.includes(x.userId)));
      saveLocalDb(db);
      return res.json({ success: true, message: 'Invitation deleted.' });
    }
  } catch (err) {
    console.error('Delete invite error:', err);
    return res.status(500).json({ success: false, message: 'Error deleting invitation.' });
  }
});

// ==========================================
// 3. VENDOR PROFILE & SERVICES
// ==========================================

// Get vendor profile by email or ID
router.get('/vendor/profile/:emailOrId', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const key = req.params.emailOrId.toLowerCase().trim();
    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected()) {
      let user = null;
      if (key.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(key).select('-password').lean();
      }
      if (!user) {
        user = await User.findOne({ email: key }).select('-password').lean();
      }
      if (user) {
        return res.json({
          success: true,
          vendor: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            city: user.city || 'Chennai',
            role: user.role,
            vendorDetails: user.vendorDetails || {}
          }
        });
      }
    }

    const db = getLocalDb();
    const localUser = (db.users || []).find(u => (u.email || '').toLowerCase() === key || u.id === key || u._id === key);
    if (!localUser) return res.status(404).json({ success: false, message: 'Vendor not found.' });

    return res.json({
      success: true,
      vendor: {
        id: localUser.id || localUser._id,
        name: localUser.name,
        email: localUser.email,
        phone: localUser.phone || '',
        city: localUser.city || 'Chennai',
        role: localUser.role,
        vendorDetails: localUser.vendorDetails || {}
      }
    });
  } catch (err) {
    console.error('Fetch vendor profile error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving vendor profile.' });
  }
});

// Update vendor profile, services, description, portfolio, pictures
router.put('/vendor/profile', async (req, res) => {
  try {
    const {
      email,
      name,
      phone,
      city,
      businessName,
      category,
      price,
      services,
      description,
      portfolio,
      pictures
    } = req.body;

    const session = await getSessionFromRequest(req).catch(() => null);
    const targetEmail = (email || (session && session.email) || '').toLowerCase().trim();

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Vendor email is required.' });
    }

    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected()) {
      const user = await User.findOne({ email: targetEmail });
      if (user) {
        if (name) user.name = String(name).trim();
        if (phone !== undefined) user.phone = String(phone).trim();
        if (city) user.city = String(city).trim();

        const prev = user.vendorDetails || {};
        user.vendorDetails = {
          businessName: businessName !== undefined ? String(businessName).trim() : (prev.businessName || user.name),
          category: category !== undefined ? String(category).trim() : (prev.category || ''),
          price: price !== undefined ? String(price).trim() : (prev.price || ''),
          services: services !== undefined ? String(services).trim() : (prev.services || ''),
          description: description !== undefined ? String(description).trim() : (prev.description || ''),
          portfolioUrl: prev.portfolioUrl || '',
          portfolio: Array.isArray(portfolio) ? portfolio : (prev.portfolio || []),
          pictures: Array.isArray(pictures) ? pictures.filter(Boolean) : (prev.pictures || [])
        };
        user.markModified('vendorDetails');
        await user.save();
        await Session.updateMany(
          { email: targetEmail },
          {
            $set: {
              name: user.name,
              phone: user.phone,
              city: user.city,
              vendorDetails: user.vendorDetails
            }
          }
        ).catch(() => {});

        return res.json({
          success: true,
          message: 'Vendor profile and services updated successfully!',
          vendor: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: user.city,
            role: user.role,
            vendorDetails: user.vendorDetails
          }
        });
      }
    }

    const db = getLocalDb();
    if (!db.users) db.users = [];
    let localUser = db.users.find(u => (u.email || '').toLowerCase() === targetEmail);
    if (!localUser && targetEmail === 'vendor.demo@eventora.com') {
      localUser = {
        id: 'eventora-demo-vendor',
        name: 'Meera Nair',
        email: targetEmail,
        phone: '+91 98401 23456',
        role: 'vendor',
        city: 'Madurai',
        vendorDetails: {}
      };
      db.users.push(localUser);
    }
    if (!localUser) {
      return res.status(404).json({ success: false, message: 'Vendor account not found.' });
    }

    if (name) localUser.name = String(name).trim();
    if (phone !== undefined) localUser.phone = String(phone).trim();
    if (city) localUser.city = String(city).trim();

    const prev = localUser.vendorDetails || {};
    localUser.vendorDetails = {
      businessName: businessName !== undefined ? String(businessName).trim() : (prev.businessName || localUser.name),
      category: category !== undefined ? String(category).trim() : (prev.category || ''),
      price: price !== undefined ? String(price).trim() : (prev.price || ''),
      services: services !== undefined ? String(services).trim() : (prev.services || ''),
      description: description !== undefined ? String(description).trim() : (prev.description || ''),
      portfolioUrl: prev.portfolioUrl || '',
      portfolio: Array.isArray(portfolio) ? portfolio : (prev.portfolio || []),
      pictures: Array.isArray(pictures) ? pictures.filter(Boolean) : (prev.pictures || [])
    };

    saveLocalDb(db);

    return res.json({
      success: true,
      message: 'Vendor profile updated successfully!',
      vendor: {
        id: localUser.id || localUser._id,
        name: localUser.name,
        email: localUser.email,
        phone: localUser.phone,
        city: localUser.city,
        role: localUser.role,
        vendorDetails: localUser.vendorDetails
      }
    });
  } catch (err) {
    console.error('Update vendor profile error:', err);
    return res.status(500).json({ success: false, message: 'Error updating vendor profile: ' + err.message });
  }
});

// ==========================================
// 4. USER QUERIES SENT TO VENDORS
// ==========================================

const SAMPLE_QUERIES = [
  {
    _id: 'q_sample_1',
    userName: 'Kavitha & Arvind',
    userEmail: 'kavitha.wedding@gmail.com',
    userPhone: '+91 98401 23456',
    eventType: 'Wedding & Reception',
    eventDate: '2027-02-18',
    guestCount: 450,
    budget: '₹1,50,000',
    message: 'Hello! We love your work. We are planning our traditional wedding ceremony in February. Are you available on 18 Feb and can you share package details?',
    status: 'New',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    _id: 'q_sample_2',
    userName: 'Rohan Mehra',
    userEmail: 'rohan.mehra@corporate.in',
    userPhone: '+91 98200 87654',
    eventType: 'Corporate & Team Meet',
    eventDate: '2026-12-10',
    guestCount: 150,
    budget: '₹85,000',
    message: 'Hi there, we are organizing our annual tech leadership summit. Looking for quality setup and timely execution. Please share a quotation.',
    status: 'Contacted',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: 'q_sample_3',
    userName: 'Ananya Sharma',
    userEmail: 'ananya.s@outlook.com',
    userPhone: '+91 97110 54321',
    eventType: 'Birthday Party',
    eventDate: '2027-01-22',
    guestCount: 80,
    budget: '₹40,000',
    message: 'Hello! Looking for customized theme coordination for my daughter\'s 1st birthday party. Need decor and catering recommendations.',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// Get queries for a vendor
router.get('/vendor/queries', async (req, res) => {
  try {
    const vendorEmail = (req.query.vendorEmail || '').toLowerCase().trim();
    const vendorId = req.query.vendorId || '';

    if (isMongooseConnected()) {
      let filter = {};
      if (vendorEmail) filter.vendorEmail = vendorEmail;
      else if (vendorId) filter.vendorId = vendorId;

      let queries = await Query.find(filter).sort({ createdAt: -1 });
      if (!queries || queries.length === 0) {
        queries = SAMPLE_QUERIES;
      }

      return res.json({ success: true, data: queries });
    } else {
      const db = getLocalDb();
      if (!db.queries) {
        db.queries = [...SAMPLE_QUERIES];
        saveLocalDb(db);
      }

      let queries = db.queries || [];
      if (vendorEmail) {
        queries = queries.filter(q => !q.vendorEmail || q.vendorEmail === vendorEmail);
      }
      if (queries.length === 0) {
        queries = SAMPLE_QUERIES;
      }

      return res.json({ success: true, data: queries });
    }
  } catch (err) {
    console.error('Fetch queries error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving user queries.' });
  }
});

// Submit a new query / inquiry from user to vendor
router.post('/vendor/queries', async (req, res) => {
  try {
    const session = await getSessionFromRequest(req).catch(() => null);
    const {
      vendorId = '',
      vendorName = '',
      vendorEmail = '',
      userName,
      userEmail,
      userPhone = '',
      eventType = 'Wedding',
      eventDate = '',
      guestCount = 200,
      budget = '',
      message = ''
    } = req.body;

    const canonicalUserEmail = ((session && session.email) || userEmail || '').toLowerCase().trim();
    const canonicalUserName = String(userName || (session && session.name) || '').trim();

    if (!canonicalUserName || !canonicalUserEmail) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const queryData = {
      vendorId: String(vendorId || '').trim(),
      vendorName: String(vendorName || '').trim(),
      vendorEmail: (vendorEmail || '').toLowerCase().trim(),
      userName: canonicalUserName,
      userEmail: canonicalUserEmail,
      userPhone: String(userPhone || '').trim(),
      eventType,
      eventDate,
      guestCount: Number(guestCount) || 200,
      budget: budget || '',
      message: message || '',
      vendorReply: '',
      repliedAt: null,
      status: 'New'
    };

    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected()) {
      const newQuery = new Query(queryData);
      await newQuery.save();
      return res.status(201).json({ success: true, message: 'Query sent to vendor successfully!', data: newQuery });
    } else {
      const db = getLocalDb();
      if (!db.queries) db.queries = [...SAMPLE_QUERIES];

      const mockId = 'q_' + Date.now();
      const savedDoc = {
        _id: mockId,
        id: mockId,
        ...queryData,
        createdAt: new Date().toISOString()
      };

      db.queries.unshift(savedDoc);
      saveLocalDb(db);

      return res.status(201).json({ success: true, message: 'Query sent successfully!', data: savedDoc });
    }
  } catch (err) {
    console.error('Create query error:', err);
    return res.status(500).json({ success: false, message: 'Could not send query: ' + err.message });
  }
});

// Get queries & vendor responses for the currently signed-in customer
router.get('/user/queries', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const session = await getSessionFromRequest(req);
    if (!session || !session.email) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const cleanEmail = String(session.email).toLowerCase().trim();

    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected()) {
      const queries = await Query.find({ userEmail: cleanEmail }).sort({ createdAt: -1 }).maxTimeMS(3000).lean();
      return res.json({ success: true, data: queries || [] });
    } else {
      const db = getLocalDb();
      const queries = (db.queries || [])
        .filter(q => String(q.userEmail || '').toLowerCase().trim() === cleanEmail)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return res.json({ success: true, data: queries });
    }
  } catch (err) {
    console.error('Fetch user queries error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving your inquiries.' });
  }
});

// Update query status and/or vendor reply response
router.patch('/vendor/queries/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status, vendorReply } = req.body || {};
    const ALLOWED_STATUSES = ['New', 'Contacted', 'Confirmed', 'Declined'];
    const updateFields = {};

    if (typeof status === 'string' && ALLOWED_STATUSES.includes(status)) {
      updateFields.status = status;
    }
    if (typeof vendorReply === 'string') {
      const cleanReply = vendorReply.trim();
      updateFields.vendorReply = cleanReply;
      updateFields.repliedAt = cleanReply ? new Date() : null;
      if (!updateFields.status && cleanReply) {
        updateFields.status = 'Contacted';
      }
    }

    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const query = await Query.findByIdAndUpdate(id, { $set: updateFields }, { returnDocument: 'after' });
      return res.json({ success: true, message: 'Response saved.', data: query });
    } else {
      const db = getLocalDb();
      if (!db.queries) db.queries = [...SAMPLE_QUERIES];
      const q = db.queries.find(x => x._id === id || x.id === id);
      if (q) {
        Object.assign(q, updateFields);
        if (q.repliedAt instanceof Date) q.repliedAt = q.repliedAt.toISOString();
        saveLocalDb(db);
      }
      return res.json({ success: true, message: 'Response saved.', data: q });
    }
  } catch (err) {
    console.error('Update query status/reply error:', err);
    return res.status(500).json({ success: false, message: 'Could not update query.' });
  }
});

// ==========================================
// 5. REGISTERED VENDORS DIRECTORY FEED
// ==========================================

function mapCategoryKey(rawCategory) {
  const s = String(rawCategory || '').toLowerCase();
  if (s.includes('venue') || s.includes('banquet') || s.includes('palace') || s.includes('hall') || s.includes('lawn') || s.includes('resort') || s.includes('mahal')) return 'venue';
  if (s.includes('makeup') || s.includes('mehendi') || s.includes('styling') || s.includes('bridal')) return 'makeup';
  if (s.includes('cater') || s.includes('food') || s.includes('sweet') || s.includes('sadya')) return 'catering';
  if (s.includes('florist') || s.includes('flower')) return 'florist';
  if (s.includes('decor') || s.includes('mandap')) return 'decor';
  if (s.includes('photo') || s.includes('video') || s.includes('drone')) return 'photo';
  if (s.includes('host') || s.includes('anchor') || s.includes('emcee')) return 'host';
  if (s.includes('dj') || s.includes('music') || s.includes('band') || s.includes('dhol')) return 'dj';
  return 'decor';
}

const DEFAULT_CAT_IMAGES = {
  venue: 'images/venues/1.jpg',
  catering: 'images/catering/1.jpg',
  decor: 'images/decor/1.jpg',
  makeup: 'images/makeup/1.jpg',
  photo: 'images/photo/1.jpg',
  host: 'images/emcee/1.JPG',
  dj: 'images/dj/1.jpg',
  florist: 'images/decor/5.jpg'
};

function normalizeVenueType(rawCategory) {
  const s = String(rawCategory || '').toLowerCase();
  if (s.includes('resort') || s.includes('palace')) return 'Resort';
  if (s.includes('lawn') || s.includes('garden')) return 'Outdoor lawn';
  if (s.includes('rooftop')) return 'Rooftop';
  if (s.includes('conference')) return 'Conference centre';
  return 'Banquet hall';
}

function mapVendorDoc(u) {
  const vd = u.vendorDetails || {};
  const cat = mapCategoryKey(vd.category);
  const rawPrice = Number(String(vd.price || '').replace(/[^\d.]/g, '')) || 15000;
  const unit = cat === 'catering' ? 'per plate' : cat === 'makeup' ? 'per person' : 'per event';
  const sv = String(vd.services || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const pictures = Array.isArray(vd.pictures) ? vd.pictures.filter(Boolean) : [];
  const portfolio = Array.isArray(vd.portfolio) ? vd.portfolio : [];
  const portfolioFallback = (portfolio.find(p => p && (p.image || p.imageUrl)) || {});
  const primaryImage = pictures[0] || portfolioFallback.image || portfolioFallback.imageUrl || DEFAULT_CAT_IMAGES[cat] || 'images/venues/1.jpg';
  return {
    id: String(u._id || u.id),
    cat,
    categoryName: vd.category || cat,
    name: vd.businessName || u.name,
    email: u.email,
    city: u.city || 'Chennai',
    from: rawPrice,
    unit,
    rating: 4.8,
    ev: ['Wedding', 'Engagement', 'Birthday', 'Anniversary'],
    sv: sv.length ? sv : [vd.category || 'Event Services'],
    image: primaryImage,
    desc: vd.description || `${vd.businessName || u.name} offers ${vd.services || 'tailored event services'} in ${u.city || 'Chennai'}.`,
    portfolio,
    pictures: pictures.length ? pictures : (primaryImage && (portfolioFallback.image || portfolioFallback.imageUrl) ? [primaryImage] : []),
    booked: Array.isArray(vd.bookedDates) ? vd.bookedDates : [],
    availability: vd.availability || {}
  };
}

function mapVenueDoc(u) {
  const vd = u.vendorDetails || {};
  const rawPrice = Number(String(vd.price || '').replace(/[^\d.]/g, '')) || 50000;
  const sv = String(vd.services || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const pictures = Array.isArray(vd.pictures) ? vd.pictures.filter(Boolean) : [];
  const portfolio = Array.isArray(vd.portfolio) ? vd.portfolio : [];
  const portfolioFallback = (portfolio.find(p => p && (p.image || p.imageUrl)) || {});
  const primaryImage = pictures[0] || portfolioFallback.image || portfolioFallback.imageUrl || DEFAULT_CAT_IMAGES.venue;
  return {
    id: String(u._id || u.id),
    name: vd.businessName || u.name,
    email: u.email,
    city: u.city || 'Chennai',
    type: normalizeVenueType(vd.category),
    categoryName: vd.category || 'Banquet Hall',
    rating: 4.8,
    cap: Number(vd.capacity) || 400,
    price: rawPrice,
    ev: ['Wedding', 'Engagement', 'Birthday', 'College & Graduation', 'Corporate & Team', 'Anniversary'],
    booked: Array.isArray(vd.bookedDates) ? vd.bookedDates : [],
    image: primaryImage,
    pictures: pictures.length ? pictures : (primaryImage && (portfolioFallback.image || portfolioFallback.imageUrl) ? [primaryImage] : []),
    portfolio,
    am: sv.length ? sv : ['Banquet Hall', 'Dining Area', 'Parking'],
    desc: vd.description || `${vd.businessName || u.name} in ${u.city || 'Chennai'} — ${vd.services || 'Verified celebration venue'}.`,
    tone: 'blue'
  };
}

async function fetchAllVendorUsers() {
  const mongoReady = await ensureDB().catch(() => false);
  let vendorUsers = [];

  if (mongoReady && isMongooseConnected()) {
    try {
      vendorUsers = await User.find({ role: 'vendor' }).select('-password').maxTimeMS(3000).lean();
    } catch (mongoErr) {
      console.warn('MongoDB vendors fetch fallback:', mongoErr.message);
    }
  }

  if (!vendorUsers || vendorUsers.length === 0) {
    const db = getLocalDb();
    vendorUsers = (db.users || []).filter(u => u.role === 'vendor');
  }
  return vendorUsers || [];
}

router.get('/vendors', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const vendorUsers = await fetchAllVendorUsers();
    const mapped = vendorUsers
      .filter(u => {
        const c = String(u.vendorDetails?.category || '').trim();
        return c && mapCategoryKey(c) !== 'venue';
      })
      .map(mapVendorDoc);

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch vendors error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching vendors.' });
  }
});

router.get('/venues', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const vendorUsers = await fetchAllVendorUsers();
    const mapped = vendorUsers
      .filter(u => {
        const c = String(u.vendorDetails?.category || '').trim();
        return c && mapCategoryKey(c) === 'venue';
      })
      .map(mapVenueDoc);

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch venues error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching venues.' });
  }
});

// ==========================================
// 6. AI CHATBOT API (OPENAI / GEMINI + PROJECT CONTEXT)
// ==========================================

router.post('/chat', handleChatRequest);

// ==========================================
// 7. GUEST LIST & PUBLIC RSVP API
// ==========================================

const GUEST_STATUSES = ['Pending', 'Accepted', 'Declined'];

function formatGuestDoc(g) {
  return {
    id: String(g._id || g.id),
    ownerEmail: g.ownerEmail || '',
    eventName: g.eventName || 'Eventora Celebration',
    eventDate: g.eventDate || '',
    name: g.name,
    email: g.email || '',
    phone: g.phone || '',
    group: g.group || '',
    diet: g.diet || '',
    plus: Number(g.plus) || 0,
    status: GUEST_STATUSES.includes(g.status) ? g.status : 'Pending',
    source: g.source || 'host',
    createdAt: g.createdAt
  };
}

async function requireApiSession(req, res, next) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  req.session = session;
  next();
}

// Get guests for logged-in user
router.get('/guests', requireApiSession, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const ownerEmail = req.session.email;
    const mongoReady = await ensureDB().catch(() => false);
    let list = [];
    let userRec = null;

    if (mongoReady && isMongooseConnected()) {
      [list, userRec] = await Promise.all([
        Guest.find({ ownerEmail }).sort({ createdAt: 1 }).lean(),
        User.findOne({ email: ownerEmail }).select('eventName eventType eventDate').lean()
      ]);
    } else {
      const db = getLocalDb();
      list = (db.guests || []).filter((g) => (g.ownerEmail || '').toLowerCase() === ownerEmail);
      userRec = (db.users || []).find((u) => (u.email || '').toLowerCase() === ownerEmail) || null;
    }

    const regName = (userRec && (userRec.eventName || userRec.eventType)) || req.session.eventName || req.session.eventType || '';
    const regDate = (userRec && userRec.eventDate) || req.session.eventDate || '';
    const firstWithEvent = list.find((g) => g.eventName || g.eventDate);
    const fallbackName = (firstWithEvent && firstWithEvent.eventName && !firstWithEvent.eventName.includes('Aarav')) ? firstWithEvent.eventName : '';
    const fallbackDate = (firstWithEvent && firstWithEvent.eventDate && firstWithEvent.eventDate !== '2027-02-18') ? firstWithEvent.eventDate : '';
    return res.json({
      success: true,
      event: {
        name: regName || fallbackName,
        date: regDate || fallbackDate
      },
      data: list.map(formatGuestDoc)
    });
  } catch (err) {
    console.error('Fetch guests error:', err);
    return res.status(500).json({ success: false, message: 'Could not load guest list.' });
  }
});

// Update event name & date on user's guest records
router.put('/guests/event', requireApiSession, async (req, res) => {
  try {
    const ownerEmail = req.session.email;
    const eventName = String((req.body && req.body.name) || req.session.eventName || '').trim();
    const eventDate = String((req.body && req.body.date) || req.session.eventDate || '').trim();
    const mongoReady = await ensureDB().catch(() => false);

    if (mongoReady && isMongooseConnected()) {
      await Guest.updateMany({ ownerEmail }, { $set: { eventName, eventDate, updatedAt: new Date() } });
    } else {
      const db = getLocalDb();
      if (!Array.isArray(db.guests)) db.guests = [];
      db.guests.forEach((g) => {
        if ((g.ownerEmail || '').toLowerCase() === ownerEmail) {
          g.eventName = eventName;
          g.eventDate = eventDate;
        }
      });
      saveLocalDb(db);
    }

    return res.json({ success: true, event: { name: eventName, date: eventDate } });
  } catch (err) {
    console.error('Update guest event error:', err);
    return res.status(500).json({ success: false, message: 'Could not update event details.' });
  }
});

// Add a single guest
router.post('/guests', requireApiSession, async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Guest name is required.' });
    }

    const doc = {
      ownerEmail: req.session.email,
      eventName: String(body.eventName || req.session.eventName || 'Eventora Celebration').trim(),
      eventDate: String(body.eventDate || req.session.eventDate || '').trim(),
      name,
      email: String(body.email || '').toLowerCase().trim(),
      phone: String(body.phone || '').trim(),
      group: String(body.group || '').trim(),
      diet: String(body.diet || '').trim(),
      plus: Math.max(0, Number(body.plus) || 0),
      status: GUEST_STATUSES.includes(body.status) ? body.status : 'Pending',
      source: 'host',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected()) {
      const created = await Guest.create(doc);
      return res.status(201).json({ success: true, data: formatGuestDoc(created) });
    }

    const db = getLocalDb();
    if (!Array.isArray(db.guests)) db.guests = [];
    const localDoc = { _id: 'gst_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), ...doc };
    db.guests.push(localDoc);
    saveLocalDb(db);
    return res.status(201).json({ success: true, data: formatGuestDoc(localDoc) });
  } catch (err) {
    console.error('Create guest error:', err);
    return res.status(500).json({ success: false, message: 'Could not add guest.' });
  }
});

// Bulk import guests (e.g. from CSV)
router.post('/guests/import', requireApiSession, async (req, res) => {
  try {
    const items = Array.isArray(req.body && req.body.guests) ? req.body.guests : [];
    const ownerEmail = req.session.email;
    const eventName = String((req.body && req.body.eventName) || req.session.eventName || 'Eventora Celebration').trim();
    const eventDate = String((req.body && req.body.eventDate) || req.session.eventDate || '').trim();

    const docs = items
      .filter((x) => x && String(x.name || '').trim())
      .map((x) => ({
        ownerEmail,
        eventName,
        eventDate,
        name: String(x.name).trim(),
        email: String(x.email || '').toLowerCase().trim(),
        phone: String(x.phone || '').trim(),
        group: String(x.group || '').trim(),
        diet: String(x.diet || '').trim(),
        plus: Math.max(0, Number(x.plus) || 0),
        status: GUEST_STATUSES.includes(x.status) ? x.status : 'Pending',
        source: 'host',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

    if (docs.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid guest rows found.' });
    }

    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected()) {
      const inserted = await Guest.insertMany(docs);
      return res.status(201).json({ success: true, count: inserted.length, data: inserted.map(formatGuestDoc) });
    }

    const db = getLocalDb();
    if (!Array.isArray(db.guests)) db.guests = [];
    const localDocs = docs.map((d, idx) => ({ _id: `gst_${Date.now()}_${idx}`, ...d }));
    db.guests.push(...localDocs);
    saveLocalDb(db);
    return res.status(201).json({ success: true, count: localDocs.length, data: localDocs.map(formatGuestDoc) });
  } catch (err) {
    console.error('Import guests error:', err);
    return res.status(500).json({ success: false, message: 'Could not import guests.' });
  }
});

// Update a guest
router.put('/guests/:id', requireApiSession, async (req, res) => {
  try {
    const id = req.params.id;
    const ownerEmail = req.session.email;
    const body = req.body || {};
    const updates = { updatedAt: new Date() };

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.email !== undefined) updates.email = String(body.email).toLowerCase().trim();
    if (body.phone !== undefined) updates.phone = String(body.phone).trim();
    if (body.group !== undefined) updates.group = String(body.group).trim();
    if (body.diet !== undefined) updates.diet = String(body.diet).trim();
    if (body.plus !== undefined) updates.plus = Math.max(0, Number(body.plus) || 0);
    if (body.status !== undefined && GUEST_STATUSES.includes(body.status)) updates.status = body.status;

    const mongoReady = await ensureDB().catch(() => false);
    if (mongoReady && isMongooseConnected() && id.match(/^[0-9a-fA-F]{24}$/)) {
      const updated = await Guest.findOneAndUpdate({ _id: id, ownerEmail }, { $set: updates }, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Guest not found.' });
      return res.json({ success: true, data: formatGuestDoc(updated) });
    }

    const db = getLocalDb();
    const guest = (db.guests || []).find((g) => (g._id === id || g.id === id) && (g.ownerEmail || '').toLowerCase() === ownerEmail);
    if (!guest) return res.status(404).json({ success: false, message: 'Guest not found.' });
    Object.assign(guest, updates);
    saveLocalDb(db);
    return res.json({ success: true, data: formatGuestDoc(guest) });
  } catch (err) {
    console.error('Update guest error:', err);
    return res.status(500).json({ success: false, message: 'Could not update guest.' });
  }
});

// Delete a guest
router.delete('/guests/:id', requireApiSession, async (req, res) => {
  try {
    const id = req.params.id;
    const ownerEmail = req.session.email;
    const mongoReady = await ensureDB().catch(() => false);

    if (mongoReady && isMongooseConnected() && id.match(/^[0-9a-fA-F]{24}$/)) {
      await Guest.deleteOne({ _id: id, ownerEmail });
      return res.json({ success: true });
    }

    const db = getLocalDb();
    db.guests = (db.guests || []).filter((g) => !((g._id === id || g.id === id) && (g.ownerEmail || '').toLowerCase() === ownerEmail));
    saveLocalDb(db);
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete guest error:', err);
    return res.status(500).json({ success: false, message: 'Could not delete guest.' });
  }
});

// Public RSVP event metadata
router.get('/rsvp/event', async (req, res) => {
  try {
    const ownerParam = String((req.query && req.query.owner) || '').toLowerCase().trim();
    const session = await getSessionFromRequest(req);
    const ownerEmail = ownerParam || (session ? session.email : '');

    let eventName = "Aarav & Meera's Wedding";
    let eventDate = '2027-02-18';

    const mongoReady = await ensureDB().catch(() => false);
    if (ownerEmail) {
      if (mongoReady && isMongooseConnected()) {
        const g = await Guest.findOne({ ownerEmail }).sort({ updatedAt: -1 }).lean();
        if (g) {
          eventName = g.eventName || eventName;
          eventDate = g.eventDate || eventDate;
        }
      } else {
        const db = getLocalDb();
        const g = (db.guests || []).find((x) => (x.ownerEmail || '').toLowerCase() === ownerEmail);
        if (g) {
          eventName = g.eventName || eventName;
          eventDate = g.eventDate || eventDate;
        }
      }
    }

    return res.json({
      success: true,
      event: { name: eventName, date: eventDate, ownerEmail }
    });
  } catch (err) {
    console.error('RSVP event error:', err);
    return res.status(500).json({ success: false, message: 'Could not load RSVP event details.' });
  }
});

// Public RSVP submission endpoint (syncs directly with Guests list)
router.post('/rsvp', async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Please enter your name.' });
    }

    const session = await getSessionFromRequest(req);
    const ownerEmail = String(body.ownerEmail || (session ? session.email : '') || '').toLowerCase().trim();
    const status = body.status === 'Declined' ? 'Declined' : 'Accepted';
    const plus = status === 'Accepted' ? Math.max(0, Number(body.plus) || 0) : 0;
    const diet = String(body.diet || '').trim();
    const eventName = String(body.eventName || "Aarav & Meera's Wedding").trim();
    const eventDate = String(body.eventDate || '').trim();

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mongoReady = await ensureDB().catch(() => false);

    if (mongoReady && isMongooseConnected()) {
      const query = {
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
      };
      if (ownerEmail) query.ownerEmail = ownerEmail;

      let existing = await Guest.findOne(query);
      if (existing) {
        existing.status = status;
        existing.plus = plus;
        if (diet) existing.diet = diet;
        existing.source = 'rsvp';
        existing.updatedAt = new Date();
        await existing.save();
        return res.json({
          success: true,
          message: 'RSVP updated successfully.',
          data: formatGuestDoc(existing)
        });
      }

      const created = await Guest.create({
        ownerEmail,
        eventName,
        eventDate,
        name,
        email: String(body.email || '').toLowerCase().trim(),
        phone: String(body.phone || '').trim(),
        group: 'RSVP Link',
        diet,
        plus,
        status,
        source: 'rsvp'
      });
      return res.status(201).json({
        success: true,
        message: 'RSVP saved successfully.',
        data: formatGuestDoc(created)
      });
    }

    const db = getLocalDb();
    if (!Array.isArray(db.guests)) db.guests = [];
    const idx = db.guests.findIndex(
      (g) =>
        String(g.name || '').toLowerCase() === name.toLowerCase() &&
        (!ownerEmail || (g.ownerEmail || '').toLowerCase() === ownerEmail)
    );

    if (idx >= 0) {
      db.guests[idx].status = status;
      db.guests[idx].plus = plus;
      if (diet) db.guests[idx].diet = diet;
      db.guests[idx].source = 'rsvp';
      db.guests[idx].updatedAt = new Date().toISOString();
      saveLocalDb(db);
      return res.json({
        success: true,
        message: 'RSVP updated successfully.',
        data: formatGuestDoc(db.guests[idx])
      });
    }

    const localDoc = {
      _id: 'gst_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      ownerEmail,
      eventName,
      eventDate,
      name,
      email: String(body.email || '').toLowerCase().trim(),
      phone: String(body.phone || '').trim(),
      group: 'RSVP Link',
      diet,
      plus,
      status,
      source: 'rsvp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.guests.push(localDoc);
    saveLocalDb(db);
    return res.status(201).json({
      success: true,
      message: 'RSVP saved successfully.',
      data: formatGuestDoc(localDoc)
    });
  } catch (err) {
    console.error('RSVP submit error:', err);
    return res.status(500).json({ success: false, message: 'Could not save RSVP.' });
  }
});

module.exports = router;
