const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerStatement,
} = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/statement', getCustomerStatement);
router.post('/', authorize('ADMIN', 'CASHIER'), createCustomer);
router.put('/:id', authorize('ADMIN', 'CASHIER'), updateCustomer);

module.exports = router;

