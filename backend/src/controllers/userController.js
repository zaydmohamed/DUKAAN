const User = require('../models/User');
const { logAudit } = require('../services/auditService');

// @desc Get all users (Admin only)
// @route GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// @desc Create a new user (Admin only)
// @route POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { name, username, email, password, role = 'CASHIER' } = req.body;

    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with that email or username already exists' });
    }

    const user = new User({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role,
    });

    await user.save();

    await logAudit({
      user: req.user,
      action: 'USER_CREATED',
      resourceType: 'User',
      resourceId: user._id,
      description: `User '${user.username}' created with role ${user.role}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update user role or status (Admin only)
// @route PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, role, status, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (status) user.status = status;
    if (password) user.password = password;

    await user.save();

    await logAudit({
      user: req.user,
      action: 'USER_PERMISSIONS_CHANGED',
      resourceType: 'User',
      resourceId: user._id,
      description: `User '${user.username}' profile/permissions updated`,
      details: { role: user.role, status: user.status },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
};

