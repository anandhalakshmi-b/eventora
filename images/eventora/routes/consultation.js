const router = require('express').Router();
const path = require('path');
const c = require('../controllers/consultationController');

const page = (file) => (req, res) => res.sendFile(path.join(__dirname, '..', 'pages', file));
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// HTML pages
router.get('/', page('consultation.html'));
router.get('/plan', page('consultation-plan.html'));   // reads ?id= in the browser
router.get('/book', page('consultation-book.html'));

// JSON API used by public/js/consultation.js
router.post('/api/generate', wrap(c.generate));
router.get('/api/plan/:id', wrap(c.getPlan));
router.post('/api/save', wrap(c.savePlan));
router.post('/api/to-checklist', wrap(c.sendToChecklist));
router.post('/api/book', wrap(c.book));

module.exports = router;
