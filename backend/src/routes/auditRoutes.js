const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAuditLogs);

module.exports = router;

