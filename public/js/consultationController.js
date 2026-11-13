const mongoose = require('mongoose');
const ConsultationPlan = require('../models/ConsultationPlan');
const ConsultantRequest = require('../models/ConsultantRequest');
const { templates, styleExtras, cityTier, tierFor } = require('../data/indianEventTemplates');

function realityNote(plan) {
  const tier = cityTier[tierFor(plan.city)];
  const perGuest = Math.round(plan.budget / plan.guests);
  const amount = '₹' + perGuest.toLocaleString('en-IN');
  return perGuest < tier.perGuest * 0.5
    ? `Your budget works out to about ${amount} per guest, which is tight for ${tier.label}. Consider fewer guests or a simpler venue.`
    : `Your budget works out to about ${amount} per guest, which looks workable for ${tier.label}.`;
}

exports.generate = async (req, res) => {
  const { eventType, eventDate, guests, budget, city, style } = req.body;
  const errors = [];
  if (!templates[eventType]) errors.push('Please choose an event type.');
  if (!eventDate) errors.push('Please choose a date.');
  if (!(Number(guests) > 0)) errors.push('Enter a valid number of guests.');
  if (!(Number(budget) > 0)) errors.push('Enter a valid budget in rupees.');
  if (!city || !city.trim()) errors.push('Enter the city.');
  if (errors.length) return res.status(400).json({ errors });

  const t = templates[eventType];
  const total = Number(budget);
  const split = Object.entries(t.budgetSplit).map(([category, percent]) => ({
    category, percent, amount: Math.round((total * percent) / 100)
  }));

  const plan = await ConsultationPlan.create({
    user: req.session && req.session.userId, // optional until the login module is merged
    eventType, eventDate, guests: Number(guests), budget: total, city: city.trim(), style,
    timeline: t.timeline.map(([when, task]) => ({ when, task })),
    venueTypes: t.venueTypes, vendorCategories: t.vendors, budgetSplit: split,
    decor: [...t.decor, ...(styleExtras[style] || [])]
  });
  res.json({ planId: plan._id });
};

exports.getPlan = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ errors: ['Plan not found.'] });
  const plan = await ConsultationPlan.findById(req.params.id).lean();
  if (!plan) return res.status(404).json({ errors: ['Plan not found.'] });
  res.json({ plan, label: templates[plan.eventType].label, reality: realityNote(plan) });
};

exports.savePlan = async (req, res) => {
  await ConsultationPlan.findByIdAndUpdate(req.body.planId, { saved: true });
  res.json({ ok: true });
};

// Creates tasks in the Checklist module. Works once the teammate's Task model exists.
exports.sendToChecklist = async (req, res) => {
  const plan = await ConsultationPlan.findById(req.body.planId);
  if (!plan) return res.status(404).json({ errors: ['Plan not found.'] });
  const Task = mongoose.models.Task; // defined by the checklist teammate
  if (!Task) return res.json({ ok: true, status: 'pending' });
  await Task.insertMany(plan.timeline.map((t) => ({
    title: t.task, category: 'Consultation', priority: 'Medium', user: plan.user, notes: t.when
  })));
  res.json({ ok: true, status: 'sent', redirect: '/checklist' });
};

exports.book = async (req, res) => {
  const { name, phone, email, preferredTime, notes, planId } = req.body;
  const errors = [];
  if (!name || !name.trim()) errors.push('Enter your name.');
  if (!/^[6-9]\d{9}$/.test((phone || '').trim())) errors.push('Enter a valid 10-digit Indian mobile number.');
  if (!/^\S+@\S+\.\S+$/.test((email || '').trim())) errors.push('Enter a valid email.');
  if (errors.length) return res.status(400).json({ errors });

  await ConsultantRequest.create({
    name, phone: phone.trim(), email, preferredTime, notes,
    plan: mongoose.isValidObjectId(planId) ? planId : undefined
  });
  res.json({ ok: true });
};
