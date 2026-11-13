const crypto = require('crypto');
const ChatMessage = require('../models/ChatMessage');
const { ruleReply } = require('../data/oraRules');

const SYSTEM_PROMPT = `You are Ora, the warm, quick and friendly planning assistant of Eventora, an event planning website for India.
Rules:
- Keep answers short (2-4 sentences) with light emoji use.
- Think Indian events: weddings (haldi, mehendi, sangeet), engagement, birthday, baby shower (godh bharai), griha pravesh, naming ceremony, festivals, corporate events.
- Use rupees (₹) and lakh/crore formatting for money.
- Suggest Eventora pages when helpful: /venues, /ideas, /budget, /checklist, /guests, /invites, /consultation.
- Do not invent specific vendors, prices or phone numbers. If unsure, say so.`;

// Try Claude first. Return null on any problem so the rule-based fallback takes over.
async function askClaude(history, message) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ORA_MODEL || 'claude-sonnet-5-5',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [...history, { role: 'user', content: message }]
      })
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return text || null;
  } catch (err) {
    console.error('Ora Claude call failed, using rules:', err.message);
    return null;
  }
}

// If the user clearly asks to open a page, give the link back with the reply
function detectLink(message) {
  const m = message.toLowerCase();
  if (!/\b(open|go to|take me|show me|take)\b/.test(m)) return null;
  return ruleReply(message).link;
}

exports.message = async (req, res) => {
  const message = String((req.body && req.body.message) || '').trim().slice(0, 500);
  if (!message) return res.status(400).json({ reply: 'Type something and I will help! 😊' });

  const sessionId = (req.body && req.body.sessionId) || crypto.randomUUID();

  let history = [];
  try {
    const past = await ChatMessage.find({ sessionId }).sort({ createdAt: -1 }).limit(8).lean();
    history = past.reverse().map((m) => ({ role: m.role === 'ora' ? 'assistant' : 'user', content: m.text }));
  } catch (e) { /* DB problems must never stop Ora from replying */ }

  let reply = await askClaude(history, message);
  let source = 'claude';
  let link = detectLink(message);

  if (!reply) {
    const r = ruleReply(message);
    reply = r.reply; link = link || r.link; source = 'rules';
  }

  try {
    await ChatMessage.insertMany([
      { sessionId, role: 'user', text: message },
      { sessionId, role: 'ora', text: reply, source }
    ]);
  } catch (e) { /* ignore logging errors */ }

  res.json({ reply, link, source, sessionId });
};
