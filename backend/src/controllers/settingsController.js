const Settings = require('../models/Settings');
const { logAudit } = require('../services/auditService');

// @desc Get shop settings
// @route GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

// @desc Update shop settings (Admin only)
// @route PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    await logAudit({
      user: req.user,
      action: 'SETTINGS_UPDATED',
      resourceType: 'Settings',
      resourceId: settings._id,
      description: 'System configuration settings updated',
      details: req.body,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};

