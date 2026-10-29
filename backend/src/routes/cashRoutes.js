const express = require('express');
const router = express.Router();
const {
  getCurrentSession,
  openSession,
  closeSession,
  getSessionHistory,
} = require('../controllers/cashController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/current', getCurrentSession);
router.post('/open', authorize('ADMIN', 'CASHIER'), openSession);
router.post('/close', authorize('ADMIN', 'CASHIER'), closeSession);
router.get('/history', authorize('ADMIN', 'CASHIER'), getSessionHistory);

module.exports = router;

