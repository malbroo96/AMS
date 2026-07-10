const asyncHandler = require('../utils/asyncHandler');
const notificationServices = require('../services/notification.services');

exports.list = asyncHandler(async (req, res) => {
  const data = await notificationServices.getCollegeNotifications(req.user);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await notificationServices.createForCollegeUser(req.user, req.body);
  res.status(201).json({ success: true, data });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const data = await notificationServices.markAsRead(req.user, req.params.id);
  res.json({ success: true, data });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  const data = await notificationServices.markAllAsRead(req.user);
  res.json({ success: true, data });
});
