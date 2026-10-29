const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  voidSale,
} = require('../controllers/saleController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', authorize('ADMIN', 'CASHIER'), createSale);
router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/:id/void', authorize('ADMIN'), voidSale);

module.exports = router;

