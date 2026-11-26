// Rule-based fallback so Ora always replies cleanly in English without emojis or Sanskrit terms.
const rules = [
  {
    keys: ['venue', 'hall', 'banquet', 'lawn', 'resort', 'palace', 'location'],
    link: '/venues',
    label: 'Explore Venues',
    reply: 'Browse banquet halls, lawns, and heritage properties on the Venues page. You can filter by city, guest capacity, and price.'
  },
  {
    keys: ['vendor', 'caterer', 'catering', 'photographer', 'photo', 'decorator', 'decor', 'dj', 'florist', 'makeup', 'officiant'],
    link: '/venues?tab=vendors',
    label: 'Browse Vendors',
    reply: 'Compare caterers, photographers, decorators, DJs, florists, and styling specialists on the Vendors tab.'
  },
  {
    keys: ['budget', 'cost', 'price', 'expense', 'lakh', 'rupee', 'calculate'],
    link: '/budget',
    label: 'Budget Tracker',
    reply: 'Set your total budget in INR, apply an event template, and track estimated versus actual expenses on the Budget page.'
  },
  {
    keys: ['checklist', 'task', 'todo', 'to-do', 'reminder', 'schedule'],
    link: '/checklist',
    label: 'Event Checklist',
    reply: 'Organize tasks, deadlines, and priorities with a live completion progress bar on the Checklist page.'
  },
  {
    keys: ['guest', 'rsvp', 'invite list', 'attendee', 'meal', 'diet'],
    link: '/guests',
    label: 'Guests & RSVPs',
    reply: 'Manage your guest list, import CSV files, track meal preferences, and share your live RSVP link on the Guests page.'
  },
  {
    keys: ['invite', 'invitation', 'card', 'e-invite', 'website'],
    link: '/invites',
    label: 'Invites Studio',
    reply: 'Design digital invitations, customize colors and fonts, and export PNG, PDF, or shareable links on the Invites page.'
  },
  {
    keys: ['idea', 'theme', 'color', 'palette', 'inspiration', 'advice'],
    link: '/ideas',
    label: 'Ideas & Advice',
    reply: 'Browse event themes, color palettes, and planning guidance on the Ideas page.'
  },
  {
    keys: ['consult', 'plan', 'starter', 'help me plan'],
    link: '/consultation',
    label: 'Free Consultation',
    reply: 'Use the Free Consultation page to generate a timeline, recommended vendor categories, and a budget split in under a minute.'
  },
  {
    keys: ['favorite', 'favourite', 'saved', 'shortlist'],
    link: '/favorites',
    label: 'View Favourites',
    reply: 'Review and compare your shortlisted venues and vendors on the Favourites page.'
  },
  {
    keys: ['register', 'login', 'signin', 'signup', 'sign up', 'account', 'session', 'cookie'],
    link: '/register',
    label: 'Login / Register',
    reply: 'Sign in or create a customer or vendor account on the Login / Register page. Your session cookie is created on login and cleared on logout.'
  },
  {
    keys: ['wedding', 'engagement', 'birthday', 'baby shower', 'housewarming', 'naming', 'festival', 'anniversary', 'corporate', 'graduation', 'farewell'],
    link: '/consultation',
    label: 'Plan Your Event',
    reply: 'Tell me your event type, date, guest count, and budget, or open the Free Consultation page to generate a custom plan.'
  },
  {
    keys: ['eventora', 'project', 'feature', 'how does', 'what can', 'module', 'page', 'dashboard'],
    link: '/',
    label: 'Home Overview',
    reply: 'Eventora includes Venues & Vendors discovery, Budget Tracker, Checklist, Guests & live RSVP sync, Invites Studio, Free Consultation, and dedicated User and Vendor dashboards.'
  },
  {
    keys: ['hi', 'hello', 'hey', 'greetings'],
    link: null,
    label: null,
    reply: 'Hello! I am Ora, your Eventora planning assistant. Ask me anything about Eventora features, venues, budgets, checklists, guests, RSVPs, or invitations.'
  },
  {
    keys: ['thank', 'thanks'],
    link: null,
    label: null,
    reply: 'You are welcome. Let me know if you need any more help planning your event.'
  }
];

const fallback = 'I can help with Eventora features, venues, vendors, budgets, checklists, guests, RSVPs, and invitations. Ask a specific question to get started.';

function ruleReply(message = '') {
  const text = String(message || '').toLowerCase();
  const match = rules.find((r) => r.keys.some((k) => new RegExp(`\\b${k}`, 'i').test(text)));
  return match ? { reply: match.reply, link: match.link, label: match.label } : { reply: fallback, link: null, label: null };
}

module.exports = { ruleReply };
