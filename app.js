const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ----- Server setup -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
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

// Fallback for pages not built yet
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Eventora running at http://localhost:${PORT}`);
});
