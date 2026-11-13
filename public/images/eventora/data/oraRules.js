// MODULE 9 - rule-based fallback so Ora ALWAYS replies, even with no API key.
// Each rule: keywords to look for, a short warm reply (India-aware), and an optional page link.
const rules = [
  { keys: ['venue', 'hall', 'banquet', 'lawn', 'resort'], link: '/venues',
    reply: 'Looking for a venue? 🏛️ Banquet halls, lawns and heritage hotels are all on our Venues page. Filter by city, capacity and price.' },
  { keys: ['vendor', 'caterer', 'catering', 'photographer', 'decorator', 'dj', 'florist', 'mehendi', 'makeup'], link: '/venues?tab=vendors',
    reply: 'You can compare caterers, photographers, decorators, DJs, florists and mehendi artists on our Vendors tab. 📸' },
  { keys: ['budget', 'cost', 'price', 'expense', 'lakh', 'rupee'], link: '/budget',
    reply: 'Let\'s set your budget 💰 Add your total in ₹ and track estimated vs actual spend by category. Need a starting split? Try the free consultation.' },
  { keys: ['checklist', 'task', 'todo', 'to-do', 'reminder'], link: '/checklist',
    reply: 'Opening your checklist ✅ Add tasks, due dates and priorities, and watch the progress bar fill up.' },
  { keys: ['guest', 'rsvp', 'invite list', 'attendee'], link: '/guests',
    reply: 'Manage guests and RSVPs here 🧑‍🤝‍🧑 You can import a CSV, group by family or table, and send reminders.' },
  { keys: ['invite', 'invitation', 'card', 'e-invite', 'website'], link: '/invites',
    reply: 'Let\'s design your invite 💌 Pick a template, add details, and share by PNG, PDF or WhatsApp.' },
  { keys: ['idea', 'theme', 'decor', 'inspiration'], link: '/ideas',
    reply: 'Need inspiration? ✨ Browse themes for weddings, birthdays, baby showers and more on the Ideas page.' },
  { keys: ['consult', 'plan', 'starter', 'help me plan'], link: '/consultation',
    reply: 'Our free consultation builds an instant plan with timeline, vendors and budget split. Takes under a minute! 🌈' },
  { keys: ['human', 'person', 'agent', 'talk to someone', 'call'], link: '/consultation/book',
    reply: 'Of course! 🙏 You can request a free call with a human planner here.' },
  { keys: ['wedding', 'shaadi', 'marriage', 'haldi', 'sangeet'], link: '/consultation',
    reply: 'Congratulations! 💍 For Indian weddings, start 10-12 months ahead: fix muhurat, book venue and caterer first. Want a full plan?' },
  { keys: ['muhurat', 'muhurtham', 'auspicious', 'pandit'], link: null,
    reply: 'For an auspicious date, check with your family pandit or priest. Fix the muhurat first, then book the venue around it. 🪔' },
  { keys: ['birthday', 'baby shower', 'godh bharai', 'griha pravesh', 'housewarming', 'naming', 'namkaran', 'diwali', 'anniversary'], link: '/consultation',
    reply: 'Lovely occasion! 🎉 Tell me the date, number of guests and budget, or try the free consultation for a ready plan.' },
  { keys: ['hi', 'hello', 'hey', 'namaste', 'vanakkam'], link: null,
    reply: 'Namaste! 🙏 I\'m Ora, your Eventora planning buddy. Ask me about venues, budgets, checklists or invites.' },
  { keys: ['thank', 'thanks'], link: null, reply: 'Happy to help! 😊 Anything else for your event?' }
];

const fallback = 'I\'m not sure about that yet 🙈 I can help with venues, vendors, budget, checklist, guests and invites. Or tap "Talk to a human".';

function ruleReply(message = '') {
  const text = message.toLowerCase();
  const match = rules.find((r) => r.keys.some((k) => new RegExp(`\\b${k}`, 'i').test(text)));
  return match ? { reply: match.reply, link: match.link } : { reply: fallback, link: null };
}

module.exports = { ruleReply };
