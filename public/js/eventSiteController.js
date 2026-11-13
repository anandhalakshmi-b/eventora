const mongoose = require('mongoose');
const Invite = require('../models/Invite');

// Public data for the mini website /e/:slug (no login needed)
exports.get = async (req, res) => {
  const invite = await Invite.findOne({ slug: req.params.slug }).lean();
  if (!invite) return res.status(404).json({ errors: ['Event not found.'] });
  const mapQuery = [invite.venue, invite.address].filter(Boolean).join(', ');
  const { rsvps, user, ...publicInvite } = invite;
  res.json({
    invite: publicInvite,
    mapSrc: mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null
  });
};

exports.rsvp = async (req, res) => {
  const invite = await Invite.findOne({ slug: req.params.slug });
  if (!invite) return res.status(404).json({ errors: ['Event not found.'] });

  const { name, phone, status, count, dietary } = req.body;
  const errors = [];
  if (!name || !name.trim()) errors.push('Enter your name.');
  if (phone && !/^[6-9]\d{9}$/.test(phone.trim())) errors.push('Enter a valid 10-digit mobile number.');
  if (errors.length) return res.status(400).json({ errors });

  const reply = {
    name: name.trim(), phone: (phone || '').trim(),
    status: status === 'Declined' ? 'Declined' : 'Accepted',
    count: Math.min(Math.max(parseInt(count, 10) || 1, 1), 20), dietary
  };

  // Feed the Guests & RSVPs module when it exists. ADJUST field names to match their Guest schema.
  const Guest = mongoose.models.Guest;
  if (Guest) {
    await Guest.create({
      name: reply.name, phone: reply.phone, dietary: reply.dietary, plusOnes: reply.count - 1,
      rsvpStatus: reply.status, event: invite.eventId, source: 'event-website'
    });
  } else {
    invite.rsvps.push(reply);
    await invite.save();
  }
  res.json({ ok: true });
};
