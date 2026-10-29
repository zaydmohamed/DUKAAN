const express = require('express');
const router = express.Router();
const {
  getDebtDashboard,
  getDebtInvoices,
  writeOffDebt,
  issueCreditNote,
} = require('../controllers/debtController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', getDebtDashboard);
router.get('/invoices', getDebtInvoices);
router.post('/write-off', authorize('ADMIN'), writeOffDebt);
router.post('/credit-note', authorize('ADMIN'), issueCreditNote);

module.exports = router;

