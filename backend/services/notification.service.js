const { mapNotification } = require('../utils/mappers');
const NotificationModel = require('../models/Notification.model');

const notificationService = {
  async list(userId, query) {
    const rows = await NotificationModel.listByUser(userId, {
      unreadOnly: query.unread === 'true',
    });
    return rows.map(mapNotification);
  },

  async markRead(id, userId) {
    const n = await NotificationModel.markRead(id, userId);
    return mapNotification(n);
  },

  async markAllRead(userId) {
    await NotificationModel.markAllRead(userId);
    return { message: 'All notifications marked as read' };
  },
};

module.exports = notificationService;
