const { Guest } = require('../models/Guest');
const { isMongooseConnected, ensureDB, getLocalDb, saveLocalDb } = require('../db');

const PAGE_LINKS = [
  { keys: ['venue', 'hall', 'banquet', 'lawn', 'resort', 'palace'], url: '/venues', label: 'Explore Venues', reply: 'Browse verified banquet halls, lawns, and heritage venues on the Venues page. You can filter by city, event type, guest capacity, and date.' },
  { keys: ['vendor', 'caterer', 'photographer', 'decorator', 'dj', 'florist', 'makeup'], url: '/vendors', label: 'Browse Vendors', reply: 'Compare verified caterers, photographers, decorators, DJs, florists, and styling artists on the Vendors page.' },
  { keys: ['budget', 'expense', 'cost'], url: '/budget', label: 'Open Budget Tracker', reply: 'Set your total event budget in INR, load a template, and track estimated versus actual expenses on the Budget Tracker page.' },
  { keys: ['checklist', 'task', 'todo'], url: '/checklist', label: 'Open Checklist', reply: 'Organize tasks, priorities, and deadlines with live progress tracking on the Checklist page.' },
  { keys: ['guest', 'attendee'], url: '/guests', label: 'Open Guests & RSVPs', reply: 'Manage your guest list, import CSVs, and share your RSVP link directly on WhatsApp from the Guests page.' },
  { keys: ['rsvp'], url: '/rsvp', label: 'Open RSVP Form', reply: 'Guests can confirm or decline attendance, add meal preferences, and send replies via WhatsApp on the RSVP page.' },
  { keys: ['invite', 'invitation', 'card'], url: '/invites', label: 'Open Invites Studio', reply: 'Design digital invitations, customize colors and fonts, and export PNG, PDF, or WhatsApp share links on the Invites page.' },
  { keys: ['idea', 'theme', 'palette'], url: '/ideas', label: 'Explore Ideas', reply: 'Browse celebration themes, color palettes, and planning guides on the Ideas page.' },
  { keys: ['consult', 'blueprint'], url: '/consultation', label: 'Open Free Consultation', reply: 'Generate a customized event timeline, vendor list, and budget split on the Free Consultation page.' },
  { keys: ['favourite', 'favorite', 'saved'], url: '/favorites', label: 'Open Favourites', reply: 'Review and compare your shortlisted venues and vendors on the Favourites page.' },
  { keys: ['dashboard'], url: '/dashboard', label: 'Open Dashboard', reply: 'View your event overview, budget progress, and upcoming milestones on your Dashboard.' },
  { keys: ['register', 'login', 'sign in', 'signup'], url: '/register', label: 'Open Login / Register', reply: 'Sign in or create a customer or vendor account on the Login / Register page.' }
];

const WEBSITE_ACTION_RE = /^(?:find\s+venues?|explore\s+venues?|browse\s+vendors?|set\s+(?:a\s+)?budget|budget\s+tracker|make\s+(?:an?\s+)?invite|create\s+(?:an?\s+)?invite|design\s+(?:an?\s+)?invite|view\s+favour?ites?|event\s+checklist|guest\s+list|free\s+consultation|open\s+.+|go\s+to\s+.+|take\s+me\s+to\s+.+)$/i;

function matchWebsiteFeature(message) {
  const raw = String(message || '').trim();
  const q = raw.toLowerCase();
  if (/^(?:what\s+is|what\s+are|who\s+is|who\s+was|define|explain)\b/i.test(q)) {
    return null;
  }
  const wantsWebsite =
    WEBSITE_ACTION_RE.test(raw) ||
    /\b(open|go to|take me|show me|navigate|visit|where is|how to|how do i|how can i|page|on eventora|in eventora|this website|the website)\b/i.test(q);
  if (!wantsWebsite) return null;

  for (const p of PAGE_LINKS) {
    if (p.keys.some((k) => new RegExp(`\\b${k}`, 'i').test(q))) {
      return p;
    }
  }
  return null;
}

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'customize_event_plan',
      description: 'Remove, replace, or add ceremonies, functions, or items in the user event plan and checklist.',
      parameters: {
        type: 'object',
        properties: {
          removeKeywords: { type: 'array', items: { type: 'string' } },
          addItems: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' }
        },
        required: ['summary']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_budget',
      description: 'Set the total budget in INR, load a budget template, or add an expense item.',
      parameters: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          preset: { type: 'string', enum: ['wedding', 'birthday', 'college', 'corporate', 'babyshower', 'housewarming', 'anniversary', 'festival'] },
          addExpense: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              estimated: { type: 'number' },
              actual: { type: 'number' }
            }
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'manage_checklist',
      description: 'Add a task, mark a task completed, or remove a task from the event checklist.',
      parameters: {
        type: 'object',
        properties: {
          addTask: { type: 'string' },
          completeKeyword: { type: 'string' },
          removeKeyword: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'manage_guest_rsvp',
      description: 'Add a guest, update RSVP status, or query guest counts for the logged-in user.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['summary', 'add', 'status'] },
          name: { type: 'string' },
          plus: { type: 'number' },
          status: { type: 'string', enum: ['Pending', 'Accepted', 'Declined'] },
          diet: { type: 'string' }
        },
        required: ['action']
      }
    }
  }
];

function parseAmountINR(text) {
  const s = String(text || '').toLowerCase().replace(/,/g, '');
  const m = s.match(/(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lakhs|lac|l|k|thousand)?/i);
  if (!m) return null;
  let num = parseFloat(m[1]);
  const unit = (m[2] || '').toLowerCase();
  if (unit === 'crore' || unit === 'cr') num *= 10000000;
  else if (unit.startsWith('l')) num *= 100000;
  else if (unit === 'k' || unit === 'thousand') num *= 1000;
  return Math.round(num);
}

function detectExplicitNavigation(message) {
  const matched = matchWebsiteFeature(message);
  if (matched) {
    return { url: matched.url, label: matched.label };
  }
  const m = String(message || '').toLowerCase();
  if (!/\b(open|go to|take me|show me|navigate|visit)\b/.test(m)) return null;
  for (const p of PAGE_LINKS) {
    if (p.keys.some((k) => m.includes(k))) {
      return { url: p.url, label: p.label };
    }
  }
  return null;
}

async function executeManageGuestRsvp(args, session) {
  if (!session || !session.email) {
    return {
      reply: 'Please log in first so I can read or update your guest list in MongoDB.',
      actions: [],
      link: '/register?mode=login',
      linkLabel: 'Sign In'
    };
  }

  const ownerEmail = session.email;
  const mongoReady = await ensureDB().catch(() => false);

  if (args.action === 'summary') {
    let guests = [];
    if (mongoReady && isMongooseConnected()) {
      guests = await Guest.find({ ownerEmail }).lean();
    } else {
      const db = getLocalDb();
      guests = (db.guests || []).filter((g) => (g.ownerEmail || '').toLowerCase() === ownerEmail);
    }
    const accepted = guests.filter((g) => g.status === 'Accepted').length;
    const pending = guests.filter((g) => g.status === 'Pending').length;
    const declined = guests.filter((g) => g.status === 'Declined').length;
    const headcount = guests.filter((g) => g.status === 'Accepted').reduce((s, g) => s + 1 + (Number(g.plus) || 0), 0);
    return {
      reply: `You currently have ${guests.length} guest(s) invited: ${accepted} confirmed (${headcount} total headcount), ${pending} pending, and ${declined} declined.`,
      actions: []
    };
  }

  if (args.action === 'add' && args.name) {
    const doc = {
      ownerEmail,
      eventName: "Aarav & Meera's Wedding",
      eventDate: '',
      name: String(args.name).trim(),
      email: '',
      phone: '',
      group: 'Chatbot',
      diet: String(args.diet || '').trim(),
      plus: Math.max(0, Number(args.plus) || 0),
      status: ['Pending', 'Accepted', 'Declined'].includes(args.status) ? args.status : 'Pending',
      source: 'host',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (mongoReady && isMongooseConnected()) {
      await Guest.create(doc);
    } else {
      const db = getLocalDb();
      if (!Array.isArray(db.guests)) db.guests = [];
      db.guests.push({ _id: 'gst_' + Date.now(), ...doc });
      saveLocalDb(db);
    }

    return {
      reply: `Added ${doc.name} (${doc.status}, ${doc.plus} additional guest(s)) to your guest list.`,
      actions: [{ type: 'refresh_guests' }]
    };
  }

  if (args.action === 'status' && args.name && args.status) {
    const escaped = String(args.name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let updated = false;
    if (mongoReady && isMongooseConnected()) {
      const res = await Guest.findOneAndUpdate(
        { ownerEmail, name: { $regex: new RegExp(escaped, 'i') } },
        { $set: { status: args.status, updatedAt: new Date() } }
      );
      updated = !!res;
    } else {
      const db = getLocalDb();
      const g = (db.guests || []).find(
        (x) => (x.ownerEmail || '').toLowerCase() === ownerEmail && String(x.name || '').toLowerCase().includes(args.name.toLowerCase())
      );
      if (g) {
        g.status = args.status;
        saveLocalDb(db);
        updated = true;
      }
    }
    return {
      reply: updated
        ? `Updated ${args.name} to ${args.status}.`
        : `I could not find a guest matching "${args.name}" in your list.`,
      actions: updated ? [{ type: 'refresh_guests' }] : []
    };
  }

  return {
    reply: 'Tell me the guest name and what you would like to add or update.',
    actions: []
  };
}

async function executeToolCall(name, args, session) {
  if (name === 'customize_event_plan') {
    const removeKeywords = Array.isArray(args.removeKeywords) ? args.removeKeywords : [];
    const addItems = Array.isArray(args.addItems) ? args.addItems : [];
    return {
      reply: args.summary || 'Updated your event plan and checklist as requested.',
      actions: [{ type: 'customize_plan', removeKeywords, addItems }]
    };
  }
  if (name === 'update_budget') {
    const parts = [];
    if (args.total >= 0) parts.push(`total budget set to ₹${Number(args.total).toLocaleString('en-IN')}`);
    if (args.preset) parts.push(`loaded ${args.preset} budget template`);
    if (args.addExpense && args.addExpense.category) {
      parts.push(`added expense "${args.addExpense.category}" (₹${Number(args.addExpense.estimated || 0).toLocaleString('en-IN')})`);
    }
    return {
      reply: parts.length ? `Updated your budget: ${parts.join(', ')}.` : 'Updated your budget.',
      actions: [{ type: 'update_budget', ...args }]
    };
  }
  if (name === 'manage_checklist') {
    const msgs = [];
    if (args.addTask) msgs.push(`Added "${args.addTask}" to your checklist.`);
    if (args.completeKeyword) msgs.push(`Marked "${args.completeKeyword}" as completed in your checklist.`);
    if (args.removeKeyword) msgs.push(`Removed "${args.removeKeyword}" from your checklist.`);
    return {
      reply: msgs.join(' ') || 'Updated your checklist.',
      actions: [{ type: 'update_checklist', ...args }]
    };
  }
  if (name === 'manage_guest_rsvp') {
    return executeManageGuestRsvp(args, session);
  }
  return null;
}

// Fast, deterministic intent & tool matcher for direct action requests + conversational understanding
async function tryDirectToolOrConversation(message, history, session) {
  const raw = String(message || '').trim();
  const q = raw.toLowerCase();

  // 1. Explicit plan/ceremony removal or replacement: e.g. "i dont want haldi change it", "remove sangeet", "skip haldi and add cocktail"
  const removeMatch = q.match(
    /(?:i\s*don'?t\s*want|don'?t\s*include|remove|skip|delete|drop|exclude|cancel|without)\s+(?:the\s+)?([a-z0-9\s&-]{2,40}?)(?:\s+(?:change\s+it|please|from\s+my\s+plan|from\s+checklist|from\s+the\s+plan|and\s+add|replace\s+with|instead)|[.,!?]|$)/i
  );
  const replaceMatch = q.match(
    /(?:replace|change|swap)\s+(?:the\s+)?([a-z0-9\s&-]{2,30}?)\s+(?:with|to|into|for)\s+([a-z0-9\s&-]{2,40}?)(?:[.,!?]|$)/i
  );

  if (replaceMatch) {
    const target = replaceMatch[1].trim();
    const replacement = replaceMatch[2].trim();
    const removeKeys = [target];
    if (target.includes('haldi')) removeKeys.push('pre-wedding morning', 'phoolon ki holi', 'turmeric');
    return {
      source: 'tool',
      reply: `Done. I removed "${target}" from your event schedule and checklist, and added "${replacement}" in its place. Let me know if you want to adjust any other ceremony or task.`,
      actions: [{ type: 'customize_plan', removeKeywords: removeKeys, addItems: [replacement] }]
    };
  }

  if (removeMatch && removeMatch[1] && !['it', 'that', 'this'].includes(removeMatch[1].trim())) {
    const target = removeMatch[1].trim();
    const addMatch = q.match(/(?:and\s+add|add\s+instead|replace\s+with)\s+([a-z0-9\s&-]{2,40})/i);
    const addItems = addMatch ? [addMatch[1].trim()] : [];
    const removeKeys = [target];
    if (target.includes('haldi')) removeKeys.push('pre-wedding morning', 'phoolon ki holi', 'turmeric');
    if (target.includes('mehendi')) removeKeys.push('henna');
    if (target.includes('sangeet')) removeKeys.push('music & dance night', 'music night');

    return {
      source: 'tool',
      reply:
        addItems.length > 0
          ? `Done. I removed "${target}" from your plan and checklist and added "${addItems[0]}" instead.`
          : `Done. I removed "${target}" from your event plan and checklist. Your timeline and tasks are now updated without it. Tell me if you want to replace it with another event (like a Welcome Dinner or Reception) or adjust your schedule order.`,
      actions: [{ type: 'customize_plan', removeKeywords: removeKeys, addItems }]
    };
  }

  // Handle follow-up like "change it" / "no haldi" when previous assistant message mentioned a ceremony or plan
  if (/\b(change it|modify it|update it|dont want|don't want)\b/i.test(q) && /\b(haldi|mehendi|sangeet|ceremony|reception|engagement|dj)\b/i.test(q)) {
    const term = q.match(/\b(haldi|mehendi|sangeet|reception|engagement|dj)\b/i)[1];
    const removeKeys = [term.toLowerCase()];
    if (term.toLowerCase() === 'haldi') removeKeys.push('pre-wedding morning', 'phoolon ki holi', 'turmeric');
    return {
      source: 'tool',
      reply: `Done. I updated your event plan and checklist to remove ${term}. Would you like to add a replacement event or reorder your remaining timeline?`,
      actions: [{ type: 'customize_plan', removeKeywords: removeKeys, addItems: [] }]
    };
  }

  // 2. Budget tool commands
  const setBudgetMatch = q.match(/(?:set|change|update|make)\s+(?:my\s+|total\s+)?budget\s+(?:to\s+|as\s+)?(?:₹|rs\.?|inr\s*)?(\d[\d,.]*(?:\s*(?:crore|cr|lakh|lakhs|lac|l|k|thousand))?)/i);
  if (setBudgetMatch) {
    const amount = parseAmountINR(setBudgetMatch[1]);
    if (amount !== null) {
      return {
        source: 'tool',
        reply: `Updated your total event budget to ₹${amount.toLocaleString('en-IN')}. Your remaining balance and utilization will reflect this immediately.`,
        actions: [{ type: 'update_budget', total: amount }]
      };
    }
  }

  const addExpMatch = q.match(/add\s+(?:an?\s+)?expense\s+(?:for\s+)?([a-z\s&]+?)\s+(?:of\s+|for\s+|at\s+)?(?:₹|rs\.?|inr\s*)?(\d[\d,.]*(?:\s*(?:crore|cr|lakh|lakhs|lac|l|k|thousand))?)/i);
  if (addExpMatch) {
    const cat = addExpMatch[1].trim();
    const est = parseAmountINR(addExpMatch[2]);
    if (cat && est !== null) {
      return {
        source: 'tool',
        reply: `Added expense "${cat}" with an estimated cost of ₹${est.toLocaleString('en-IN')} to your Budget Tracker.`,
        actions: [{ type: 'update_budget', addExpense: { category: cat, estimated: est, actual: 0 } }]
      };
    }
  }

  // 3. Checklist task tool commands
  const addTaskMatch = raw.match(/^(?:please\s+)?(?:add|create)\s+(?:a\s+)?(?:task|todo|to-do|item)(?:\s+to\s+checklist)?\s*[:\-]?\s*(.+)$/i);
  if (addTaskMatch) {
    const taskTitle = addTaskMatch[1].trim();
    return {
      source: 'tool',
      reply: `Added "${taskTitle}" to your event checklist.`,
      actions: [{ type: 'update_checklist', addTask: taskTitle }]
    };
  }

  const completeTaskMatch = raw.match(/(?:mark|complete|finish|done)\s+(?:task\s+)?["']?([a-z0-9\s&-]{2,40})["']?(?:\s+as\s+(?:done|complete|completed))?/i);
  if (completeTaskMatch && !q.includes('guest')) {
    const kw = completeTaskMatch[1].trim();
    return {
      source: 'tool',
      reply: `Marked checklist tasks matching "${kw}" as completed.`,
      actions: [{ type: 'update_checklist', completeKeyword: kw }]
    };
  }

  // 4. Guest / RSVP tool commands
  const addGuestMatch = raw.match(/(?:add|invite)\s+guest\s+([a-z\s.&'-]{2,40}?)(?:\s+with\s+(\d+)\s+plus|\s*$)/i);
  if (addGuestMatch) {
    const gName = addGuestMatch[1].trim();
    const plus = addGuestMatch[2] ? Number(addGuestMatch[2]) : 0;
    const res = await executeManageGuestRsvp({ action: 'add', name: gName, plus, status: 'Pending' }, session);
    return { source: 'tool', ...res };
  }

  if (/\b(how many|count|status|summary)\b.*\b(guest|guests|rsvp|rsvps|confirmed|attending)\b/i.test(q)) {
    const res = await executeManageGuestRsvp({ action: 'summary' }, session);
    return { source: 'tool', ...res };
  }

  // 5. Correct planning order / step-by-step sequence question
  if (/\b(order|sequence|step\s*by\s*step|steps|where\s+to\s+start|how\s+to\s+start|what\s+first|which\s+first|correct\s+order)\b/i.test(q)) {
    return {
      source: 'assistant',
      reply: [
        'Here is the recommended order to plan an event smoothly:',
        '1. Set your budget and guest estimate first so every decision fits your target spend.',
        '2. Fix the event date and book your venue early, as dates and venues fill up fastest.',
        '3. Hire core vendors next (caterer, photographer, decorator, and entertainment).',
        '4. Design your invitations and send your RSVP link (or share directly on WhatsApp).',
        '5. Track guest confirmations, dietary notes, and final checklist tasks in the last 2 to 4 weeks.'
      ].join('\n'),
      actions: []
    };
  }

  // 6. Website-based feature / quick-button queries (e.g. "Set a budget", "Find venues", "Make an invite")
  const websiteMatch = matchWebsiteFeature(raw);
  if (websiteMatch) {
    return {
      source: 'website',
      reply: websiteMatch.reply,
      actions: [],
      link: websiteMatch.url,
      linkLabel: websiteMatch.label
    };
  }

  return null;
}

function extractSearchTopic(message) {
  let s = String(message || '').trim();
  s = s.replace(/[?!.]+$/g, '').trim();
  s = s.replace(
    /^(?:can you\s+|please\s+|could you\s+)?(?:tell me\s+|explain\s+|define\s+|describe\s+|what\s+is\s+(?:a\s+|an\s+|the\s+)?|what\s+are\s+(?:the\s+)?|who\s+is\s+(?:the\s+)?|who\s+was\s+(?:the\s+)?|what\s+does\s+|meaning\s+of\s+)/i,
    ''
  );
  s = s.replace(/\s+mean$/i, '').trim();
  return s || String(message || '').trim();
}

function trimSentences(text, maxSentences = 3) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const parts = clean.match(/[^.!?]+[.!?]+/g);
  if (!parts) return clean.slice(0, 420);
  return parts.slice(0, maxSentences).join(' ').trim();
}

async function queryWikipediaSummary(topic) {
  const headers = { 'User-Agent': 'EventoraApp/1.0 (event-planning-assistant)' };
  const candidates = topic.split(/\s+/).length <= 2 ? [`${topic} wedding ceremony`, `${topic} ceremony`, topic] : [topic];

  let fallbackHit = null;
  for (const query of candidates) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=4`;
      const sRes = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(6000) });
      if (!sRes.ok) continue;
      const sData = await sRes.json();
      const hits = sData?.query?.search || [];
      for (const hit of hits) {
        const title = hit && hit.title;
        if (!title) continue;
        const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
        const sumRes = await fetch(sumUrl, { headers, signal: AbortSignal.timeout(6000) });
        if (!sumRes.ok) continue;
        const sum = await sumRes.json();
        if (sum && sum.type !== 'disambiguation' && sum.extract) {
          const exLower = sum.extract.toLowerCase();
          const titleLower = (sum.title || title).toLowerCase();
          const qLower = topic.toLowerCase();
          if (query !== topic && !exLower.includes(qLower) && !titleLower.includes(qLower)) continue;
          const result = { title: sum.title || title, extract: trimSentences(sum.extract, 3), source: 'wikipedia-api' };
          if (!fallbackHit) fallbackHit = result;
          const isEntertainment = /\b(film|movie|album|song|band|novel|television series|video game)\b/.test(exLower);
          const askedEntertainment = /\b(film|movie|album|song|band|novel|series|game)\b/.test(qLower);
          if (isEntertainment && !askedEntertainment) continue;
          return result;
        }
      }
    } catch (e) { /* continue */ }
  }
  return fallbackHit;
}

async function queryDuckDuckGo(topic) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'EventoraApp/1.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data && (data.AbstractText || data.Answer || data.Definition)) || '';
    if (text.trim()) {
      return { title: data.Heading || topic, extract: trimSentences(text, 3), source: 'duckduckgo-api' };
    }
  } catch (e) { /* ignore */ }
  return null;
}

async function fetchFreeKnowledgeAPI(message) {
  const raw = String(message || '').trim();
  const isKnowledgeQuestion =
    /^(?:can you\s+|please\s+|could you\s+)?(?:what\s+is|what\s+are|who\s+is|who\s+was|explain|define|describe|tell me about|meaning of|what does)\b/i.test(raw);
  if (!isKnowledgeQuestion) {
    return null;
  }

  const topic = extractSearchTopic(message);
  if (!topic || topic.length < 2) return null;

  const [ddg, wiki] = await Promise.all([
    queryDuckDuckGo(topic),
    queryWikipediaSummary(topic)
  ]);

  const best = ddg || wiki;
  if (!best || !best.extract) return null;

  return {
    reply: best.extract,
    source: best.source
  };
}

function buildConversationalFallback(message) {
  const q = String(message || '').toLowerCase().trim();

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings)\b/.test(q)) {
    return 'Hello! I am Ora, your Eventora planning assistant. Ask me any common question, planning order, or tell me directly to update your budget, checklist, or event plan.';
  }
  if (/\b(thank|thanks|thx|helpful|great|awesome|cool|ok|okay)\b/.test(q) && q.length < 40) {
    return 'You are welcome. Let me know if you want to adjust your plan, set a budget, add a task, or ask another question.';
  }
  if (/\b(budget|cost|money|spend|split|allocate|rupee|lakh|inr)\b/.test(q)) {
    return 'A typical celebration budget allocates around 30-35% to venue, 30% to catering, 10-15% to decor and flowers, 8-10% to photography, and the rest to attire, music, invitations, and contingency. Tell me "set budget to 800000" or "add expense Catering 250000" if you want me to update your tracker directly.';
  }
  if (/\b(rsvp|whatsapp|guest|guests|invite|invitation)\b/.test(q)) {
    return 'To manage RSVPs, add your guests and optional host WhatsApp number on the Guests page, then share the RSVP link directly via WhatsApp. When a guest confirms or declines on the RSVP form, it saves to MongoDB and updates your guest list automatically, with a one-tap WhatsApp reply option.';
  }
  if (/\b(venue|hall|palace|lawn|location|vendor|caterer|photographer|decorator|dj)\b/.test(q)) {
    return 'Book your venue right after fixing your date and rough headcount, then lock in catering, photography, and decor in that order. You can filter available venues and registered vendors by city, event type, and price in Eventora.';
  }
  if (/\b(wedding|birthday|corporate|anniversary|baby shower|housewarming|party|event)\b/.test(q)) {
    return 'Start by choosing your date, guest count, and total budget, then customize which functions or milestones you want to include. You can also tell me things like "remove haldi", "set budget to 500000", or "add task book photographer" and I will update them for you.';
  }
  return 'I can help with common questions, event planning order, Eventora features, or direct updates like "remove haldi", "set budget to 600000", or "add task book DJ".';
}

module.exports = {
  TOOL_DEFINITIONS,
  detectExplicitNavigation,
  executeToolCall,
  tryDirectToolOrConversation,
  fetchFreeKnowledgeAPI,
  buildConversationalFallback
};
