const express = require('express');
const router = express.Router();
const { User, hashPasswordAsync, verifyPasswordAsync } = require('../models/User');
const { Invite } = require('../models/Invite');
const { Query } = require('../models/Query');
const { isMongooseConnected, ensureDB, getLocalDb, saveLocalDb } = require('../db');

// ==========================================
// 1. AUTHENTICATION & USER REGISTRATION
// ==========================================

function formatUserResponse(user) {
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    city: user.city || 'Chennai',
    eventType: user.eventType || 'Tamil Thirumanam',
    eventDate: user.eventDate || '',
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
      eventType = 'Tamil Thirumanam',
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

        return res.status(201).json({
          success: true,
          message: 'Registration successful! Saved to MongoDB.',
          user: formatUserResponse(newUser)
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

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      user: formatUserResponse(userDoc)
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const mongoReady = await ensureDB().catch(() => false);

    if (mongoReady && isMongooseConnected()) {
      try {
        const user = await User.findOne({ email: cleanEmail }).maxTimeMS(3000).lean();
        if (user) {
          const ok = await verifyPasswordAsync(password, user.password);
          if (!ok) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
          }
          return res.json({
            success: true,
            message: 'Login successful!',
            user: formatUserResponse(user)
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
      return res.json({
        success: true,
        message: 'Login successful!',
        user: formatUserResponse(localUser)
      });
    }

    // Built-in quick demo accounts if not yet created in DB
    if (cleanEmail === 'demo@eventora.com' && password === 'Eventora123!') {
      return res.json({
        success: true,
        message: 'Demo login successful!',
        user: {
          id: 'eventora-demo-user',
          name: 'Eventora Demo User',
          email: cleanEmail,
          phone: '+91 98401 00000',
          role: 'user',
          city: 'Chennai',
          eventType: 'Tamil Thirumanam & Celebration'
        }
      });
    }
    if (cleanEmail === 'vendor.demo@eventora.com' && password === 'Vendor123!') {
      return res.json({
        success: true,
        message: 'Vendor demo login successful!',
        user: {
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
        }
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
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

// ==========================================
// 3. VENDOR PROFILE & SERVICES
// ==========================================

// Get vendor profile by email or ID
router.get('/vendor/profile/:emailOrId', async (req, res) => {
  try {
    const key = req.params.emailOrId.toLowerCase().trim();
    if (isMongooseConnected()) {
      let user = null;
      if (key.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(key);
      }
      if (!user) {
        user = await User.findOne({ email: key });
      }
      if (!user) return res.status(404).json({ success: false, message: 'Vendor not found.' });

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
    } else {
      const db = getLocalDb();
      const user = (db.users || []).find(u => u.email === key || u.id === key || u._id === key);
      if (!user) return res.status(404).json({ success: false, message: 'Vendor not found.' });

      return res.json({
        success: true,
        vendor: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          city: user.city || 'Chennai',
          role: user.role,
          vendorDetails: user.vendorDetails || {}
        }
      });
    }
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

    if (!email) {
      return res.status(400).json({ success: false, message: 'Vendor email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isMongooseConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Vendor account not found.' });
      }

      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (city) user.city = city.trim();

      user.vendorDetails = {
        businessName: businessName !== undefined ? businessName : (user.vendorDetails?.businessName || user.name),
        category: category !== undefined ? category : (user.vendorDetails?.category || ''),
        price: price !== undefined ? price : (user.vendorDetails?.price || ''),
        services: services !== undefined ? services : (user.vendorDetails?.services || ''),
        description: description !== undefined ? description : (user.vendorDetails?.description || ''),
        portfolioUrl: user.vendorDetails?.portfolioUrl || '',
        portfolio: Array.isArray(portfolio) ? portfolio : (user.vendorDetails?.portfolio || []),
        pictures: Array.isArray(pictures) ? pictures : (user.vendorDetails?.pictures || [])
      };

      await user.save();

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
    } else {
      const db = getLocalDb();
      if (!db.users) db.users = [];
      const user = db.users.find(u => u.email === cleanEmail);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Vendor account not found.' });
      }

      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (city) user.city = city.trim();

      user.vendorDetails = {
        businessName: businessName !== undefined ? businessName : (user.vendorDetails?.businessName || user.name),
        category: category !== undefined ? category : (user.vendorDetails?.category || ''),
        price: price !== undefined ? price : (user.vendorDetails?.price || ''),
        services: services !== undefined ? services : (user.vendorDetails?.services || ''),
        description: description !== undefined ? description : (user.vendorDetails?.description || ''),
        portfolioUrl: user.vendorDetails?.portfolioUrl || '',
        portfolio: Array.isArray(portfolio) ? portfolio : (user.vendorDetails?.portfolio || []),
        pictures: Array.isArray(pictures) ? pictures : (user.vendorDetails?.pictures || [])
      };

      saveLocalDb(db);

      return res.json({
        success: true,
        message: 'Vendor profile updated in database!',
        vendor: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          city: user.city,
          role: user.role,
          vendorDetails: user.vendorDetails
        }
      });
    }
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
    message: 'Vanakkam! We love your work. We are planning our traditional wedding ceremony in February. Are you available on 18 Feb and can you share package details?',
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
    const {
      vendorId = '',
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

    if (!userName || !userEmail) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const queryData = {
      vendorId,
      vendorEmail: (vendorEmail || '').toLowerCase().trim(),
      userName: userName.trim(),
      userEmail: userEmail.toLowerCase().trim(),
      userPhone: userPhone.trim(),
      eventType,
      eventDate,
      guestCount: Number(guestCount) || 200,
      budget: budget || '',
      message: message || '',
      status: 'New'
    };

    if (isMongooseConnected()) {
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

// Update query status (e.g. Mark as Contacted, Confirmed, Declined)
router.patch('/vendor/queries/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (isMongooseConnected()) {
      const query = await Query.findByIdAndUpdate(id, { status }, { new: true });
      return res.json({ success: true, message: 'Status updated.', data: query });
    } else {
      const db = getLocalDb();
      if (!db.queries) db.queries = [...SAMPLE_QUERIES];
      const q = db.queries.find(x => x._id === id || x.id === id);
      if (q) {
        q.status = status;
        saveLocalDb(db);
      }
      return res.json({ success: true, message: 'Status updated.', data: q });
    }
  } catch (err) {
    console.error('Update query status error:', err);
    return res.status(500).json({ success: false, message: 'Could not update status.' });
  }
});

// ==========================================
// 5. REGISTERED VENDORS DIRECTORY FEED
// ==========================================

function mapCategoryKey(rawCategory) {
  const s = String(rawCategory || '').toLowerCase();
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
  catering: 'images/catering/1.jpg',
  decor: 'images/decor/1.jpg',
  makeup: 'images/makeup/1.jpg',
  photo: 'images/photo/1.jpg',
  host: 'images/emcee/1.JPG',
  dj: 'images/dj/1.jpg',
  florist: 'images/decor/5.jpg'
};

function mapVendorDoc(u) {
  const vd = u.vendorDetails || {};
  const cat = mapCategoryKey(vd.category);
  const rawPrice = Number(String(vd.price || '').replace(/[^\d.]/g, '')) || 15000;
  const unit = cat === 'catering' ? 'per plate' : cat === 'makeup' ? 'per person' : 'per event';
  const sv = String(vd.services || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const pictures = Array.isArray(vd.pictures) ? vd.pictures : [];
  const portfolio = Array.isArray(vd.portfolio) ? vd.portfolio : [];
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
    image: pictures[0] || DEFAULT_CAT_IMAGES[cat] || 'images/venues/1.jpg',
    desc: vd.description || `${vd.businessName || u.name} offers ${vd.services || 'tailored event services'} in ${u.city || 'Chennai'}.`,
    portfolio,
    pictures,
    booked: Array.isArray(vd.bookedDates) ? vd.bookedDates : [],
    availability: vd.availability || {}
  };
}

router.get('/vendors', async (req, res) => {
  try {
    const mongoReady = await ensureDB().catch(() => false);
    let vendorUsers = [];
    let usedMongo = false;

    if (mongoReady && isMongooseConnected()) {
      try {
        vendorUsers = await User.find({ role: 'vendor' }).select('-password').maxTimeMS(3000).lean();
        usedMongo = true;
      } catch (mongoErr) {
        console.warn('MongoDB vendors fetch fallback:', mongoErr.message);
      }
    }

    if (!usedMongo) {
      const db = getLocalDb();
      vendorUsers = (db.users || []).filter(u => u.role === 'vendor');
    }

    const mapped = vendorUsers.map(mapVendorDoc);

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch vendors error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching vendors.' });
  }
});

module.exports = router;