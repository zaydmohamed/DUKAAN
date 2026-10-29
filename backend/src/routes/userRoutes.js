const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);

module.exports = router;

