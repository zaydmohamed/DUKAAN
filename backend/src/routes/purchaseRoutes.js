const express = require('express');
const router = express.Router();
const {
  createPurchase,
  receivePurchase,
  getPurchases,
  getPurchaseById,
} = require('../controllers/purchaseController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', authorize('ADMIN', 'STOCK_MANAGER'), createPurchase);
router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/:id/receive', authorize('ADMIN', 'STOCK_MANAGER'), receivePurchase);

module.exports = router;

