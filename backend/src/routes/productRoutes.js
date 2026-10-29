const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('ADMIN', 'STOCK_MANAGER'), createProduct);
router.put('/:id', authorize('ADMIN', 'STOCK_MANAGER'), updateProduct);
router.post('/:id/adjust-stock', authorize('ADMIN', 'STOCK_MANAGER'), adjustStock);

module.exports = router;

