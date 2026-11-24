// SHARED FILE - each teammate adds ONE line for their module.
const router = require('express').Router();

router.use('/consultation', require('./consultation')); // Module 5
router.use('/ora', require('./ora'));                   // Module 9
router.use('/invites', require('./invites'));           // Module 10 (builder)
router.use('/e', require('./eventSite'));               // Module 10 (public event website /e/:id)
// router.use('/venues', require('./venues'));          // teammate
// router.use('/budget', require('./budget'));          // teammate
// router.use('/checklist', require('./checklist'));    // teammate
// router.use('/guests', require('./guests'));          // teammate

module.exports = router;
