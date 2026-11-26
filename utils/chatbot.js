const { User } = require('../models/User');
const { Guest } = require('../models/Guest');
const { Invite } = require('../models/Invite');
const { ChatMessage } = require('../models/ChatMessage');
const { isMongooseConnected, ensureDB, getLocalDb } = require('../db');
const { getSessionFromRequest } = require('./session');
const {
  TOOL_DEFINITIONS,
  detectExplicitNavigation,
  executeToolCall,
  tryDirectToolOrConversation,
  fetchFreeKnowledgeAPI,
  buildConversationalFallback
} = require('./chatbotTools');

const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

async function buildProjectContext(session, clientContext) {
  const mongoReady = await ensureDB().catch(() => false);
  let vendorCount = 0;
  let inviteCount = 0;
  let guestSummary = null;

  if (mongoReady && isMongooseConnected()) {
    try {
      vendorCount = await User.countDocuments({ role: 'vendor' }).maxTimeMS(2000);
      inviteCount = await Invite.countDocuments().maxTimeMS(2000);
      if (session && session.email) {
        const guests = await Guest.find({ ownerEmail: session.email }).select('status plus').maxTimeMS(2000).lean();
        const accepted = guests.filter((g) => g.status === 'Accepted').length;
        const pending = guests.filter((g) => g.status === 'Pending').length;
        const declined = guests.filter((g) => g.status === 'Declined').length;
        const headcount = guests.filter((g) => g.status === 'Accepted').reduce((s, g) => s + 1 + (Number(g.plus) || 0), 0);
        guestSummary = { total: guests.length, accepted, pending, declined, headcount };
      }
    } catch (err) {
      console.warn('Chatbot context DB read warning:', err.message);
    }
  } else {
    const db = getLocalDb();
    vendorCount = (db.users || []).filter((u) => u.role === 'vendor').length;
    inviteCount = (db.invites || []).length;
    if (session && session.email) {
      const guests = (db.guests || []).filter((g) => (g.ownerEmail || '').toLowerCase() === session.email);
      const accepted = guests.filter((g) => g.status === 'Accepted').length;
      const pending = guests.filter((g) => g.status === 'Pending').length;
      const declined = guests.filter((g) => g.status === 'Declined').length;
      const headcount = guests.filter((g) => g.status === 'Accepted').reduce((s, g) => s + 1 + (Number(g.plus) || 0), 0);
      guestSummary = { total: guests.length, accepted, pending, declined, headcount };
    }
  }

  const lines = [
    'Eventora is an event planning platform built with Express, EJS/HTML, and MongoDB Atlas.',
    'Chronological Event Planning Order: 1) Budget & guest estimate -> 2) Date & venue booking -> 3) Core vendors (catering, photography, decor, music) -> 4) Digital invitations & WhatsApp RSVP links -> 5) Track RSVPs, dietary notes & final checklist tasks.',
    'Modules in Eventora: /venues, /vendors, /budget, /checklist, /guests, /rsvp (supports direct WhatsApp reply), /invites, /consultation, /favorites, /dashboard, /vendor-dashboard.',
    `Live Stats: ${vendorCount} registered vendor(s), ${inviteCount} saved invitation(s).`
  ];

  if (session) {
    lines.push(`Logged-in user: ${session.name || session.email} (role: ${session.role}).`);
  } else {
    lines.push('Visitor is not logged in yet.');
  }

  if (guestSummary) {
    lines.push(`Guest list: ${guestSummary.total} invited (${guestSummary.accepted} accepted, ${guestSummary.pending} pending, ${guestSummary.declined} declined, ${guestSummary.headcount} headcount).`);
  }

  if (clientContext && typeof clientContext === 'object') {
    if (clientContext.currentPage) lines.push(`Current page: ${String(clientContext.currentPage).slice(0, 120)}`);
    if (clientContext.budgetSummary) lines.push(`User Budget: ${String(clientContext.budgetSummary).slice(0, 200)}`);
  }

  return lines.join('\n');
}

function buildSystemPrompt(projectContext) {
  return [
    'You are Ora, a natural, conversational event planning assistant for Eventora.',
    'Rules:',
    '- Reply conversationally and directly to what the user asks (general questions, planning order, tips, follow-ups, or Eventora project questions).',
    '- Do NOT tell the user to go open another page unless they ask where to find it. When the user asks to change their plan, budget, checklist, or guests, call the appropriate tool.',
    '- Keep answers clear and concise in plain English with NO emojis and NO Sanskrit words.',
    '- Format currency in Indian Rupees (INR / ₹) when discussing budgets.',
    '',
    'LIVE EVENTORA CONTEXT:',
    projectContext
  ].join('\n');
}

async function callOpenAICompatible(systemPrompt, history, message, session) {
  const apiKey = (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return null;

  const endpoint = (process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL).trim();
  const model = (process.env.OPENAI_MODEL || DEFAULT_MODEL).trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === 'ora' ? 'assistant' : 'user',
        content: m.text
      })),
      { role: 'user', content: message }
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        max_tokens: 450,
        temperature: 0.5
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`AI API error (${res.status}):`, errText.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const choice = data?.choices?.[0]?.message;
    if (!choice) return null;

    if (Array.isArray(choice.tool_calls) && choice.tool_calls.length > 0) {
      const actions = [];
      const replies = [];
      for (const tc of choice.tool_calls) {
        const fnName = tc?.function?.name;
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(tc?.function?.arguments || '{}');
        } catch (e) {}
        const result = await executeToolCall(fnName, fnArgs, session);
        if (result) {
          if (result.reply) replies.push(result.reply);
          if (Array.isArray(result.actions)) actions.push(...result.actions);
        }
      }
      if (replies.length || actions.length) {
        return {
          reply: replies.join(' ') || 'Done. I updated that for you.',
          actions,
          source: 'groq-openai+tool'
        };
      }
    }

    const reply = (choice.content || '').trim();
    return reply ? { reply, actions: [], source: 'groq-openai' } : null;
  } catch (err) {
    console.warn('AI API call failed:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function handleChatRequest(req, res) {
  try {
    const message = String((req.body && req.body.message) || '').trim().slice(0, 1000);
    if (!message) {
      return res.status(400).json({ success: false, reply: 'Please enter a message so I can help.' });
    }

    const session = await getSessionFromRequest(req);
    const historyKey = session ? session.sessionId : null;

    let history = [];
    if (historyKey) {
      const mongoReady = await ensureDB().catch(() => false);
      if (mongoReady && isMongooseConnected()) {
        try {
          const past = await ChatMessage.find({ sessionId: historyKey }).sort({ createdAt: -1 }).limit(8).lean();
          history = past.reverse();
        } catch (e) { /* ignore read errors */ }
      }
    } else if (Array.isArray(req.body && req.body.history)) {
      history = req.body.history
        .slice(-6)
        .filter((m) => m && typeof m.text === 'string')
        .map((m) => ({ role: m.role === 'ora' ? 'ora' : 'user', text: String(m.text).slice(0, 500) }));
    }

    const directResult = await tryDirectToolOrConversation(message, history, session);
    const explicitNav = detectExplicitNavigation(message);

    let reply;
    let source;
    let actions = [];
    let link = explicitNav ? explicitNav.url : null;
    let linkLabel = explicitNav ? explicitNav.label : null;

    if (directResult) {
      reply = directResult.reply;
      source = directResult.source;
      actions = directResult.actions || [];
      if (directResult.link) {
        link = directResult.link;
        linkLabel = directResult.linkLabel || 'Open Page';
      }
    } else {
      const projectContext = await buildProjectContext(session, req.body && req.body.context);
      const systemPrompt = buildSystemPrompt(projectContext);
      const aiResult = await callOpenAICompatible(systemPrompt, history, message, session);

      if (aiResult && aiResult.reply) {
        reply = aiResult.reply;
        source = aiResult.source;
        actions = aiResult.actions || [];
      } else {
        const knowledge = await fetchFreeKnowledgeAPI(message);
        if (knowledge && knowledge.reply) {
          reply = knowledge.reply;
          source = knowledge.source;
        } else {
          reply = buildConversationalFallback(message);
          source = 'assistant';
        }
      }
    }

    if (historyKey && isMongooseConnected()) {
      try {
        await ChatMessage.insertMany([
          { sessionId: historyKey, role: 'user', text: message, source: 'user' },
          { sessionId: historyKey, role: 'ora', text: reply, source }
        ]);
      } catch (e) { /* ignore persistence errors */ }
    }

    return res.json({
      success: true,
      reply,
      source,
      actions,
      link,
      linkLabel
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({
      success: false,
      reply: 'Sorry, something went wrong while processing your question. Please try again.'
    });
  }
}

module.exports = { handleChatRequest };
