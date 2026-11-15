const express = require('express');
const router = express.Router();
const { User, hashPassword, verifyPassword } = require('../models/User');
const { Invite } = require('../models/Invite');
const { isMongooseConnected, getLocalDb, saveLocalDb } = require('../db');

// ==========================================
// 1. AUTHENTICATION & USER REGISTRATION
// ==========================================

// Register a new user or vendor
router.post('/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'user',
      city = 'Chennai',
      eventType = 'Tamil Thirumanam',
      eventDate = '',
      guestCount = 200,
      businessName = '',
      category = '',
      price = '',
      services = '',
      portfolioUrl = ''
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    if (isMongooseConnected()) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      const newUser = new User({
        name: name.trim(),
        email: cleanEmail,
        password: hashPassword(password),
        phone: (phone || '').trim(),
        role: role === 'vendor' ? 'vendor' : 'user',
        city: city || 'Chennai',
        eventType,
        eventDate,
        guestCount: Number(guestCount) || 200,
        vendorDetails: {
          businessName: businessName || name,
          category,
          price,
          services,
          portfolioUrl
        }
      });

      await newUser.save();

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Saved to MongoDB.',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          city: newUser.city,
          eventType: newUser.eventType
        }
      });
    } else {
      // Local fallback buffer
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
        name: name.trim(),
        email: cleanEmail,
        password: hashPassword(password),
        phone: (phone || '').trim(),
        role: role === 'vendor' ? 'vendor' : 'user',
        city: city || 'Chennai',
        eventType,
        eventDate,
        guestCount: Number(guestCount) || 200,
        vendorDetails: {
          businessName: businessName || name,
          category,
          price,
          services,
          portfolioUrl
        },
        createdAt: new Date().toISOString()
      };

      db.users.push(userDoc);
      saveLocalDb(db);

      return res.status(201).json({
        success: true,
        message: 'Registration successful! (Saved to local database buffer)',
        user: {
          id: userDoc.id,
          name: userDoc.name,
          email: userDoc.email,
          role: userDoc.role,
          city: userDoc.city,
          eventType: userDoc.eventType
        }
      });
    }
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isMongooseConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      return res.json({
        success: true,
        message: 'Login successful!',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          city: user.city,
          eventType: user.eventType
        }
      });
    } else {
      const db = getLocalDb();
      const user = (db.users || []).find(u => u.email === cleanEmail);
      if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      return res.json({
        success: true,
        message: 'Login successful!',
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          city: user.city,
          eventType: user.eventType
        }
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ==========================================
// 2. INVITATIONS & DIGITAL CARDS
// ==========================================

// Create / Save an invitation card
router.post('/invites', async (req, res) => {
  try {
    const data = req.body || {};
    const slug = data.slug || ('patrika-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6));

    const inviteData = {
      slug,
      userId: data.userId || 'guest',
      template: data.template || 'kanjivaram',
      heading: data.heading || '॥ ஓம் ஸ்ரீ கணேசாய நமஹ ॥',
      title: data.title || 'Aarav & Meera Thirumanam',
      hosts: data.hosts || '',
      date: data.date || '',
      time: data.time || '',
      venue: data.venue || '',
      address: data.address || '',
      message: data.message || '',
      dressCode: data.dressCode || 'Traditional Pattu Veshti / Kanjivaram Silk',
      rsvpContact: data.rsvpContact || '',
      feastDetails: data.feastDetails || 'Traditional Banana Leaf Kalyana Virundhu & Filter Kaapi',
      compliments: data.compliments || 'With Best Compliments from Family & Friends',
      accent: data.accent || '#D4AF37',
      bg: data.bg || '#7F1D1D',
      fontFamily: data.fontFamily || 'Playfair Display',
      photoUrl: data.photoUrl || ''
    };

    if (isMongooseConnected()) {
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

// Get all invitations
router.get('/invites', async (req, res) => {
  try {
    if (isMongooseConnected()) {
      const invites = await Invite.find().sort({ createdAt: -1 }).limit(50);
      return res.json({ success: true, data: invites });
    } else {
      const db = getLocalDb();
      return res.json({ success: true, data: db.invites || [] });
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
    if (isMongooseConnected()) {
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
    if (isMongooseConnected()) {
      await Invite.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Invitation deleted from MongoDB.' });
    } else {
      const db = getLocalDb();
      db.invites = (db.invites || []).filter(x => x._id !== id && x.id !== id);
      saveLocalDb(db);
      return res.json({ success: true, message: 'Invitation deleted.' });
    }
  } catch (err) {
    console.error('Delete invite error:', err);
    return res.status(500).json({ success: false, message: 'Error deleting invitation.' });
  }
});

module.exports = router;
