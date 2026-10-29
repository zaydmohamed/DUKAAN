/**
 * Helper to parse date ranges for dashboards and reports
 */
const getDateRange = (filter = 'this_month', customStart = null, customEnd = null) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (filter.toLowerCase()) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'this_week':
      // Start of current week (Monday)
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    case 'custom':
      if (customStart) {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      if (customEnd) {
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate.setHours(23, 59, 59, 999);
      }
      break;

    case 'all':
      startDate = new Date(0); // Epoch
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
};

module.exports = { getDateRange };

