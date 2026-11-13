const mongoose = require('mongoose');
const Invite = require('../models/Invite');
const templates = require('../data/inviteTemplates');

const FONTS = ['Playfair Display', 'Dancing Script', 'Poppins', 'Inter'];

exports.create = async (req, res) => {
  const b = req.body;
  const t = templates.find((x) => x.key === b.template);
  const errors = [];
  if (!t) errors.push('Please choose a template.');
  if (!b.title || !b.title.trim()) errors.push('Enter the event title.');
  if (b.rsvpContact && !/^[6-9]\d{9}$/.test(b.rsvpContact.trim()) && !/^\S+@\S+\.\S+$/.test(b.rsvpContact.trim())) {
    errors.push('RSVP contact must be a 10-digit mobile number or an email.');
  }
  if (errors.length) return res.status(400).json({ errors });

  const invite = await Invite.create({
    user: req.session && req.session.userId,
    template: t.key, heading: t.heading,
    title: b.title.trim(), hosts: b.hosts, date: b.date || undefined, time: b.time,
    venue: b.venue, address: b.address, dressCode: b.dressCode, rsvpContact: b.rsvpContact,
    message: b.message, fontFamily: FONTS.includes(b.fontFamily) ? b.fontFamily : t.font,
    accent: /^#[0-9a-fA-F]{6}$/.test(b.accent || '') ? b.accent : t.fg,
    bg: t.bg,
    photo: req.file ? `/uploads/${req.file.filename}` : undefined
  });
  res.json({ slug: invite.slug });
};

// Returns the invite plus share links for the invite page
exports.get = async (req, res) => {
  const invite = await Invite.findOne({ slug: req.params.slug }).lean();
  if (!invite) return res.status(404).json({ errors: ['Invite not found.'] });

  const base = `${req.protocol}://${req.get('host')}`;
  const shareUrl = `${base}/e/${invite.slug}`;
  const text = `You are invited to ${invite.title}! Details and RSVP: ${shareUrl}`;

  // "Send to guests": works once the Guests teammate's model exists.
  // ADJUST the field names below to match their Guest schema (name, phone, email).
  let guestLinks = [];
  const Guest = mongoose.models.Guest;
  if (Guest) {
    const guests = await Guest.find(invite.eventId ? { event: invite.eventId } : {}).limit(300).lean();
    guestLinks = guests.map((g) => ({
      name: g.name,
      whatsapp: g.phone ? `https://wa.me/91${String(g.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}` : null,
      email: g.email ? `mailto:${g.email}?subject=${encodeURIComponent('Invitation: ' + invite.title)}&body=${encodeURIComponent(text)}` : null
    }));
  }

  const { rsvps, user, ...publicInvite } = invite;
  res.json({
    invite: publicInvite, shareUrl,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(text)}`,
    mailUrl: `mailto:?subject=${encodeURIComponent('Invitation: ' + invite.title)}&body=${encodeURIComponent(text)}`,
    guestLinks
  });
};
