const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getCategories);
router.post('/', authorize('ADMIN', 'STOCK_MANAGER'), createCategory);
router.put('/:id', authorize('ADMIN', 'STOCK_MANAGER'), updateCategory);
router.delete('/:id', authorize('ADMIN'), deleteCategory);

module.exports = router;

