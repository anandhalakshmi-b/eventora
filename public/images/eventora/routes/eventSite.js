const router = require('express').Router();
const path = require('path');
const c = require('../controllers/eventSiteController');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// JSON API (declared first so "api" is never treated as a slug)
router.get('/api/:slug', wrap(c.get));
router.post('/api/:slug/rsvp', wrap(c.rsvp));

// Public HTML page
router.get('/:slug', (req, res) => res.sendFile(path.join(__dirname, '..', 'pages', 'event.html')));

module.exports = router;
