const NotificationModel = require('../models/Notification.model');
const ApiError = require('../utils/ApiError');
const { getPool, sql } = require('../config/database');

const ALLOWED_TYPES = [
  'Application',
  'Interested Student',
  'Profile',
  'Course',
  'Notice',
  'System',
];

const ALLOWED_PRIORITIES = ['urgent', 'reminder', 'success', 'info'];

function mapNotification(row) {
  if (!row) return null;
  return {
    id: String(row.Id),
    collegeId: row.CollegeId,
    type: row.Type,
    title: row.Title,
    description: row.Description || '',
    priority: row.Priority,
    read: !!row.IsRead,
    referenceId: row.ReferenceId != null ? String(row.ReferenceId) : null,
    referenceType: row.ReferenceType || null,
    createdAt: row.CreatedAt instanceof Date ? row.CreatedAt.toISOString() : row.CreatedAt,
  };
}

async function resolveCollegeIdForUser(user) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, user.id)
    .query('SELECT CollegeID FROM dbo.Colleges WHERE UserID = @userId');
  const row = result.recordset[0];
  if (!row) throw new ApiError('College profile not found', 404);
  return row.CollegeID;
}

const notificationServices = {
  mapNotification,

  async resolveCollegeIdForUser(user) {
    return resolveCollegeIdForUser(user);
  },

  /**
   * Create a notification for a college. Used by workflow services and POST /api/notifications.
   * Failures in callers should be non-blocking where appropriate (see notifyCollege).
   */
  async createNotification(data) {
    if (!data?.collegeId) throw new ApiError('collegeId is required', 400);
    if (!data?.title) throw new ApiError('title is required', 400);
    if (!data?.type || !ALLOWED_TYPES.includes(data.type)) {
      throw new ApiError(`type must be one of: ${ALLOWED_TYPES.join(', ')}`, 400);
    }

    const priority = data.priority || 'info';
    if (!ALLOWED_PRIORITIES.includes(priority)) {
      throw new ApiError(`priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`, 400);
    }

    const referenceId =
      data.referenceId == null || data.referenceId === ''
        ? null
        : parseInt(String(data.referenceId), 10);

    const row = await NotificationModel.create({
      collegeId: data.collegeId,
      type: data.type,
      title: data.title,
      description: data.description || '',
      priority,
      referenceId: Number.isFinite(referenceId) ? referenceId : null,
      referenceType: data.referenceType || null,
    });

    return mapNotification(row);
  },

  /** Fire-and-forget helper for workflow services — never fails the parent operation. */
  async notifyCollege(data) {
    try {
      return await notificationServices.createNotification(data);
    } catch (err) {
      console.error('[notifications] Failed to create notification:', err.message);
      return null;
    }
  },

  async getCollegeNotifications(user) {
    const collegeId = await resolveCollegeIdForUser(user);
    const rows = await NotificationModel.findByCollege(collegeId);
    return rows.map(mapNotification);
  },

  async createForCollegeUser(user, body) {
    const collegeId = await resolveCollegeIdForUser(user);
    return notificationServices.createNotification({
      ...body,
      collegeId,
    });
  },

  async markAsRead(user, notificationId) {
    const collegeId = await resolveCollegeIdForUser(user);
    const id = parseInt(String(notificationId), 10);
    if (!Number.isFinite(id)) throw new ApiError('Invalid notification id', 400);

    const existing = await NotificationModel.findById(id);
    if (!existing || Number(existing.CollegeId) !== Number(collegeId)) {
      throw new ApiError('Notification not found', 404);
    }

    const row = await NotificationModel.markAsRead(id);
    return mapNotification(row);
  },

  async markAllAsRead(user) {
    const collegeId = await resolveCollegeIdForUser(user);
    await NotificationModel.markAllAsRead(collegeId);
    return { success: true };
  },
};

module.exports = notificationServices;
