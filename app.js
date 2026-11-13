const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ----- Server setup -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'ejs'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----- Data shared by the layout -----
// One entry per module. Colour keys match the classes in styles.css.
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
  { nav: 'Register', name: 'Registration', path: '/register', color: 'green',
    desc: 'Create an account as a user or as a vendor.' },
  { nav: 'Ora', name: 'Ora, the AI Chatbot', path: '/ora', color: 'gradient',
    desc: 'Ask Ora for planning help, ideas or a quick page link.' },
  { nav: 'Invites', name: 'Invites & Websites', path: '/invites', color: 'pink',
    desc: 'Design an invitation and share a mini event website.' }
];

// Placeholder content for the Home page. Replace with real copy and figures.
const steps = [
  { title: 'Create an account', text: 'Sign up in under a minute.' },
  { title: 'Choose venues and vendors', text: 'Compare options and save your favourites.' },
  { title: 'Track and invite', text: 'Manage your budget, checklist and guests.' }
];

const stats = [
  { value: '10', label: 'planning tools in one place' },
  { value: '8+', label: 'invitation designs' },
  { value: '1', label: 'calm place for every detail' }
];

const quotes = [
  { text: 'Planning our wedding felt light for the first time.', by: 'Placeholder customer, Bengaluru' },
  { text: 'The budget tracker kept us on track all the way.', by: 'Placeholder customer, Chennai' }
];

const featuredVendors = [
  { name: 'Placeholder Garden Venue', city: 'Coimbatore', category: 'Venue', price: 'From ₹50,000' },
  { name: 'Placeholder Flora Studio', city: 'Coimbatore', category: 'Florist', price: 'From ₹8,000' },
  { name: 'Placeholder Frame Co.', city: 'Chennai', category: 'Photographer', price: 'From ₹25,000' }
];

// Every page gets the same layout data and the logged-in user (auth arrives in step 2).
app.use((req, res, next) => {
  res.locals.currentUser = null;
  res.locals.modules = modules;
  res.locals.activePath = req.path;
  next();
});

// ----- Routes -----
app.get('/', (req, res) => {
  res.render('home', { steps, stats, quotes, featuredVendors });
});

// Newsletter sign-up stub: accepts the form and returns to the Home page.
app.post('/newsletter', (req, res) => {
  res.redirect('/#newsletter');
});

// ----- Other pages -----
// Each nav link maps to an HTML file inside the /pages folder.
// "aliases" are old file names used in links inside those pages (e.g. href="venues.html").
const pages = [
  { route: '/venues',       file: 'venues.html',             aliases: ['venues.html'] },
  { route: '/vendors',      file: 'vendors.html',            aliases: ['vendors.html'] },
  { route: '/favorites',    file: 'favorites.html',          aliases: ['favorites.html'] },
  { route: '/ideas',        file: 'eventora-ideas.html',     aliases: ['ideas.html', 'eventora-ideas.html'] },
  { route: '/budget',       file: 'budget.html',             aliases: ['budget.html'] },
  { route: '/consultation', file: 'consultation.html',       aliases: ['consultation.html'] },
  { route: '/checklist',    file: 'eventora-checklist.html', aliases: ['checklist.html', 'eventora-checklist.html'] },
  { route: '/guests',       file: 'guests.html',             aliases: ['guests.html'] },
  { route: '/rsvp',         file: 'rsvp.html',               aliases: ['rsvp.html'] },
  { route: '/register',     file: 'eventora-register.html',  aliases: ['register.html', 'eventora-register.html'] },
  { route: '/ora',          file: 'chatbot.html',            aliases: ['ora.html', 'chatbot.html'] },
  { route: '/invites',      file: 'invites.html',            aliases: ['invites.html'] }
];

pages.forEach((page) => {
  app.get(page.route, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', page.file));
  });
  // Old-style links such as "venues.html" go to the clean URL "/venues".
  page.aliases.forEach((alias) => {
    app.get('/' + alias, (req, res) => res.redirect(page.route));
  });
});

// Old links back to the home page
['index.html', 'eventora-home.html'].forEach((name) => {
  app.get('/' + name, (req, res) => res.redirect('/'));
});

// Some pages still ask for the old logo file name
app.get('/eventora_logo_slanted.png', (req, res) => res.redirect('/images/logo.png'));

// Fallback for pages not built yet
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// ----- Start the server -----
// If the port is busy, try the next one instead of crashing.
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

startServer(Number(PORT));