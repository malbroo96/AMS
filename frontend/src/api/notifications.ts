import api from './axios';

export type CollegeNotificationType =
  | 'Application'
  | 'Interested Student'
  | 'Profile'
  | 'Course'
  | 'Notice'
  | 'System';

export type CollegeNotificationPriority = 'urgent' | 'reminder' | 'success' | 'info';

export type CollegeNotification = {
  id: string;
  collegeId?: number;
  type: CollegeNotificationType;
  title: string;
  description: string;
  createdAt: string;
  priority: CollegeNotificationPriority;
  read: boolean;
  referenceId?: string | null;
  referenceType?: string | null;
};

export type CollegeNotificationDraft = {
  type: CollegeNotificationType;
  title: string;
  description?: string;
  priority?: CollegeNotificationPriority;
  referenceId?: number | string | null;
  referenceType?: string | null;
};

export const getNotifications = () =>
  api.get<{ success: boolean; data: CollegeNotification[] }>('/notifications');

export const createNotification = (data: CollegeNotificationDraft) =>
  api.post<{ success: boolean; data: CollegeNotification }>('/notifications', data);

export const markNotificationAsRead = (id: string) =>
  api.patch<{ success: boolean; data: CollegeNotification }>(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = () =>
  api.patch<{ success: boolean; data: { success: boolean } }>('/notifications/read-all');
