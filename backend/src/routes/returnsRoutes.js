const express = require('express');
const router = express.Router();
const { createReturn, getReturns } = require('../controllers/returnsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', authorize('ADMIN', 'CASHIER'), createReturn);
router.get('/', getReturns);

module.exports = router;

