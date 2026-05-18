const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.list(req.user.id, req.query);
  res.json({ success: true, data: notifications });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user.id);
  res.json({ success: true, data: notification });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);
  res.json({ success: true, data: result });
});
