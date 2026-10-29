const AuditLog = require('../models/AuditLog');

// @desc Get audit logs with filters (Admin only)
// @route GET /api/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, resourceType, userId, startDate, endDate, limit = 100 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (userId) query.user = userId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };

