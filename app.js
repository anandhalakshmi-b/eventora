require('dotenv').config();
const express = require('express');
const path = require('path');
const { connectDB } = require('./db');
const { getSessionFromRequest } = require('./utils/session');
const { handleChatRequest } = require('./utils/chatbot');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// ----- Server setup -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'ejs'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.json({ limit: '15mb' }));

// API Routes for MongoDB registration, auth, invites, chatbot, and RSVPs
app.use('/api', require('./routes/api'));

// ----- Auth Middleware for Protected Pages -----
async function requirePageAuth(req, res, next) {
  try {
    const session = await getSessionFromRequest(req);
    if (session) {
      req.session = session;
      return next();
    }
  } catch (err) {
    console.warn('Session check error:', err.message);
  }
  const redirectTarget = req.originalUrl || '/dashboard';
  return res.redirect('/register?mode=login&redirect=' + encodeURIComponent(redirectTarget));
}

// ----- Data shared by the layout -----
// One entry per module. Colour keys match the classes in styles.css.
// (Ora is accessible via the persistent floating assistant on all pages)
const modules = [
  { nav: 'Home', name: 'Home & About Us', path: '/', color: 'cyan',
    desc: 'A friendly start that points you to every part of Eventora.' },
  { nav: 'Venues & Vendors', name: 'Venues & Vendors', path: '/venues', color: 'blue',
    desc: 'Find and compare venues and service providers in one place.' },
  { nav: 'Ideas', name: 'Ideas & Advice', path: '/ideas', color: 'purple',
    desc: 'Themes, colour palettes and planning tips for every occasion.' },
  { nav: 'Budget', name: 'Budget Calculator & Tracker', path: '/budget', color: 'red',
    desc: 'Set a budget, track what you spend and never overshoot.' },
  { nav: 'Consultation', name: 'Free Event Planning Consultation', path: '/consultation', color: 'gradient',
    desc: 'Get an instant, personalised starter plan for your event.' },
  { nav: 'Checklist', name: 'Checklist', path: '/checklist', color: 'orange',
    desc: 'Templates and tasks so nothing important gets missed.' },
  { nav: 'Guests', name: 'Guests & RSVPs', path: '/guests', color: 'yellow',
    desc: 'Track who is coming, dietary needs and replies in one list.' },
  { nav: 'Invites', name: 'Invites & Websites', path: '/invites', color: 'pink',
    desc: 'Design an invitation and share a mini event website.' },
  { nav: 'Register', name: 'Registration', path: '/register', color: 'green',
    desc: 'Create an account as a user or as a vendor.' }
];

// Celebration categories for Home page
const celebrationEvents = [
  { name: 'Weddings & Receptions', tag: 'Palaces & Banquet Halls', image: 'images/home/wedding.jpg', color: 'purple',
    desc: 'Grand wedding halls, heritage palaces, curated banquet feasts, and bridal styling.',
    venueLink: '/venues?event=Wedding', budgetLink: '/budget', inviteLink: '/invites' },
  { name: 'Engagements & Ring Ceremonies', tag: 'Ring Ceremonies', image: 'images/home/engagement.jpg', color: 'pink',
    desc: 'Scenic rooftop terraces, romantic floral backdrops, and intimate catering spreads.',
    venueLink: '/venues?event=Engagement', inviteLink: '/invites' },
  { name: 'Birthday Parties', tag: 'Kids & Milestones', image: 'images/home/birthday.jpg', color: 'orange',
    desc: 'Fun party halls with play corners, custom designer cakes, balloon arches, and party DJs.',
    venueLink: '/venues?event=Birthday', budgetLink: '/budget', inviteLink: '/invites' },
  { name: 'College Fests & Farewells', tag: 'Campus & Convocations', image: 'images/home/9.jpg', color: 'cyan',
    desc: 'Tiered auditoriums, stage lighting, live sound consoles, DJ nights, and batch mementos.',
    venueLink: '/venues?event=College%20%26%20Graduation', budgetLink: '/budget', inviteLink: '/invites' },
  { name: 'Corporate & Team Meets', tag: 'Offsites & Summits', image: 'images/home/10.jpg', color: 'blue',
    desc: 'Modern conference centres, break-out rooms, AV projectors, executive dining, and team resorts.',
    venueLink: '/venues?event=Corporate%20%26%20Team', budgetLink: '/budget', inviteLink: '/invites' },
  { name: 'Baby Showers & Blessings', tag: 'Family Blessings', image: 'images/home/babyshower.jpg', color: 'yellow',
    desc: 'Charming celebration spaces, fresh flower arrangements, 7-course traditional feasts, and gifts.',
    venueLink: '/venues?event=Baby%20Shower', budgetLink: '/budget', inviteLink: '/invites' },
  { name: 'Housewarming Celebrations', tag: 'New Home Blessings', image: 'images/home/girha.jpg', color: 'green',
    desc: 'Vegetarian lunch catering, fresh leaf garlands, and auspicious ceremony coordination.',
    venueLink: '/venues?event=Housewarming', budgetLink: '/budget', inviteLink: '/invites' },
  { name: 'Anniversary Celebrations', tag: 'Milestone Romance', image: 'images/home/anniversary.jpg', color: 'red',
    desc: 'Beachfront lawns, sunset dining, acoustic live musicians, and romantic banquets.',
    venueLink: '/venues?event=Anniversary', budgetLink: '/budget', inviteLink: '/invites' },
  { name: 'Naming Ceremonies', tag: 'Cradle Functions', image: 'images/home/12.jpg', color: 'pink',
    desc: 'Cradle decoration with fresh jasmine and silks, family feast caterers, and digital announcements.',
    venueLink: '/venues?event=Naming%20Ceremony', inviteLink: '/invites' },
  { name: 'Festivals & Cultural Events', tag: 'Community Celebrations', image: 'images/venues/7.jpg', color: 'orange',
    desc: 'Open-air grounds with fairy lights, live percussion and folk bands, and festive feasts.',
    venueLink: '/venues?event=Festival', budgetLink: '/budget', inviteLink: '/invites' }
];

const steps = [
  { title: 'Set Date & Guests', text: 'Enter event dates, guest headcount, and budget in Indian Rupees with 1-click presets.' },
  { title: 'Discover Venues & Masters', text: 'Compare verified banquet halls, lawns, caterers, photographers, DJs, and makeup artists.' },
  { title: 'Design & Share Invites', text: 'Create beautiful cards across 10 event templates, download PNG/PDF, and collect WhatsApp RSVPs.' }
];

const stats = [
  { value: '10', label: 'Celebration Categories' },
  { value: '10+', label: 'Designer E-Invite Templates' },
  { value: '500+', label: 'Verified Venues & Vendors' },
  { value: '1', label: 'Calm Platform for All Events' }
];

const quotes = [
  { text: 'Planning our 3-day royal wedding in Madurai was effortless. Eventora connected us with our stage decorator, traditional caterer, and live music troupe seamlessly.', by: 'Priya & Karthik · Wedding, Bengaluru' },
  { text: 'Organised my daughter\'s 1st birthday party in Coimbatore. The balloon decorator and dessert table caterer were punctual and amazing!', by: 'Ananya & Vikram · Birthday, Coimbatore' },
  { text: 'We organised our 2026 College Farewell for 400 students using Eventora’s budget tracker and auditorium booking. Unbelievably smooth!', by: 'Arjun · College Farewell, Chennai' },
  { text: 'Booked Bloom Conference Centre and executive buffet catering for our 150-person corporate offsite. The WhatsApp RSVP links saved hours.', by: 'Deepa R. · Corporate Summit, Bengaluru' }
];

const featuredVendors = [];

// Every page gets the same layout data and the logged-in user
app.use((req, res, next) => {
  res.locals.currentUser = null;
  res.locals.modules = modules;
  res.locals.activePath = req.path;
  next();
});

// ----- Routes -----
app.get('/', (req, res) => {
  res.render('home', { celebrationEvents, steps, stats, quotes, featuredVendors });
});

// Newsletter sign-up stub
app.post('/newsletter', (req, res) => {
  res.redirect('/#newsletter');
});

// Ora Chatbot API route (powered by OpenAI / Gemini + Eventora project context)
app.post('/ora/message', handleChatRequest);

// ----- Other pages -----
// Each nav link maps to an HTML file inside the /pages folder.
const pages = [
  { route: '/venues',             file: 'venues.html',             aliases: ['venues.html'] },
  { route: '/vendors',            file: 'vendors.html',            aliases: ['vendors.html'] },
  { route: '/favorites',          file: 'favorites.html',          aliases: ['favorites.html'] },
  { route: '/ideas',              file: 'eventora-ideas.html',     aliases: ['ideas.html', 'eventora-ideas.html'] },
  { route: '/budget',             file: 'budget.html',             aliases: ['budget.html'] },
  { route: '/consultation',       file: 'consultation.html',       aliases: ['consultation.html'] },
  { route: '/consultation/book',  file: 'consultation-book.html',  aliases: ['consultation-book.html'] },
  { route: '/consultation/plan',  file: 'consultation-plan.html',  aliases: ['consultation-plan.html'] },
  { route: '/checklist',          file: 'eventora-checklist.html', aliases: ['checklist.html', 'eventora-checklist.html'] },
  { route: '/guests',             file: 'guests.html',             aliases: ['guests.html'] },
  { route: '/rsvp',               file: 'rsvp.html',               aliases: ['rsvp.html'], public: true },
  { route: '/register',           file: 'eventora-register.html',  aliases: ['register.html', 'eventora-register.html'], public: true },
  { route: '/ora',                file: 'chatbot.html',            aliases: ['ora.html', 'chatbot.html'], public: true },
  { route: '/invites',            file: 'invites.html',            aliases: ['invites.html'] },
  { route: '/invites/view',       file: 'invites-view.html',       aliases: ['invites-view.html'], public: true },
  { route: '/event',              file: 'event.html',              aliases: ['event.html'] },
  { route: '/dashboard',          file: 'eventora-dashboard.html', aliases: ['eventora-dashboard.html', 'dashboard.html'] },
  { route: '/vendor-dashboard',   file: 'vendor-dashboard.html',   aliases: ['vendor-dashboard.html'] },
  { route: '/chatbot',            file: 'chatbot.html',            aliases: ['chatbot.html'], public: true }
];

pages.forEach((page) => {
  const middlewares = page.public ? [] : [requirePageAuth];
  app.get(page.route, ...middlewares, (req, res) => {
    if (page.route === '/register') res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'pages', page.file));
  });
  // Old-style links such as "venues.html" go to the clean URL "/venues".
  page.aliases.forEach((alias) => {
    app.get('/' + alias, ...middlewares, (req, res) => res.redirect(page.route));
  });
});

// Alias singular /guest to /guests (protected by auth)
app.get(['/guest', '/guest.html'], requirePageAuth, (req, res) => {
  res.redirect('/guests');
});

// Old links back to the home page
['index.html', 'eventora-home.html', 'home.html'].forEach((name) => {
  app.get('/' + name, (req, res) => res.redirect('/'));
});

// Static serve for pages folder (enforce auth for protected HTML files)
const PUBLIC_PAGE_FILES = new Set([
  'chatbot.html',
  'ora.html',
  'register.html',
  'eventora-register.html',
  'rsvp.html',
  'invites-view.html',
  'home.html',
  'index.html',
  'eventora-home.html'
]);

app.use('/pages', async (req, res, next) => {
  const requested = path.basename((req.path || '').toLowerCase());
  if (!requested || PUBLIC_PAGE_FILES.has(requested)) {
    return next();
  }
  return requirePageAuth(req, res, next);
}, express.static(path.join(__dirname, 'pages')));

// Logo redirect
app.get('/eventora_logo_slanted.png', (req, res) => res.redirect('/images/logo.png'));

// Fallback for pages not built yet
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// ----- Start the server -----
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Eventora running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

if (require.main === module) {
  startServer(Number(PORT));
}

module.exports = app;
