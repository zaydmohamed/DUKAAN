const express = require('express');
const router = express.Router();
const { getDashboard, getReport } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/:reportType', getReport);

module.exports = router;

