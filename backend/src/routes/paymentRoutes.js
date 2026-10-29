const express = require('express');
const router = express.Router();
const {
  recordCustomerPayment,
  recordSupplierPayment,
  getPayments,
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getPayments);
router.post('/customer', authorize('ADMIN', 'CASHIER'), recordCustomerPayment);
router.post('/supplier', authorize('ADMIN', 'STOCK_MANAGER'), recordSupplierPayment);

module.exports = router;

