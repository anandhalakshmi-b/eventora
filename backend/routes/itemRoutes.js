const express = require('express');
const Item = require('../models/itemModel');

const router = express.Router();

router.get('/', async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.json(items);
});

router.post('/', async (req, res) => {
  try {
    const created = await Item.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;