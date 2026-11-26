/* Guests, Consultation & Seed cleanup */
const { ruleReply } = require('../data/oraRules');
exports.message = async (req, res) => {
  const message = String((req.body && req.body.message) || '').trim().slice(0, 500);
  if (!message) return res.status(400).json({ reply: 'Type something and I will help.' });
  const r = ruleReply(message);
  res.json({ reply: r.reply, link: r.link, source: 'rules' });
};
