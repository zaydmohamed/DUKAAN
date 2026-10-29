const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_dukaan_jwt_key_2026_xyz!@#',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc Login user & return token
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    await logAudit({
      user,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user._id,
      description: `User ${user.username} logged in successfully`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get current logged-in user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = { login, getMe };

