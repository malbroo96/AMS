const analyticsService = require('../services/analytics.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getDashboardAnalytics();
  res.json({ success: true, data: analytics });
});
