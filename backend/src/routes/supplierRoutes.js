const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  getSupplierStatement,
} = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.get('/:id/statement', getSupplierStatement);
router.post('/', authorize('ADMIN', 'STOCK_MANAGER'), createSupplier);
router.put('/:id', authorize('ADMIN', 'STOCK_MANAGER'), updateSupplier);

module.exports = router;

