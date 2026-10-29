const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  user,
  action,
  resourceType,
  resourceId = null,
  description,
  details = {},
  reason = '',
  ipAddress = '',
}) => {
  try {
    const logEntry = new AuditLog({
      user: user?._id || user?.id,
      userName: user?.name || 'System',
      userRole: user?.role || 'SYSTEM',
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : null,
      description,
      details,
      reason,
      ipAddress,
    });
    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('[AuditLog Error] Failed to write audit record:', error.message);
  }
};

module.exports = { logAudit };

