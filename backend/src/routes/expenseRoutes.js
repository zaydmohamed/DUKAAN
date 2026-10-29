const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getExpenses);
router.post('/', authorize('ADMIN', 'CASHIER'), createExpense);
router.delete('/:id', authorize('ADMIN'), deleteExpense);

module.exports = router;

