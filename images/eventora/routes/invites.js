const router = require('express').Router();
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const c = require('../controllers/invitesController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'public', 'uploads'),
  filename: (req, file, cb) => cb(null, crypto.randomBytes(8).toString('hex') + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|webp)$/.test(file.mimetype))
});

const page = (file) => (req, res) => res.sendFile(path.join(__dirname, '..', 'pages', file));
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// HTML pages
router.get('/', page('invites.html'));
router.get('/view/:slug', page('invites-view.html')); // slug is read in the browser from the URL

// JSON API
router.post('/api', (req, res, next) =>
  upload.single('photo')(req, res, (err) =>
    err ? res.status(400).json({ errors: ['Photo must be a JPG, PNG or WebP under 3 MB.'] }) : next()),
  wrap(c.create));
router.get('/api/:slug', wrap(c.get));

module.exports = router;
