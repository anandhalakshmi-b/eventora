const router = require('express').Router();
const path = require('path');
const ora = require('../controllers/oraController');

router.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'pages', 'ora.html'))); // full-page chat
router.post('/message', ora.message);   // used by floating widget and full page

module.exports = router;
