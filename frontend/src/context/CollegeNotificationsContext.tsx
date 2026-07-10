import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createNotification as createNotificationApi,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type CollegeNotification,
  type CollegeNotificationDraft,
} from '../api/notifications';

export type {
  CollegeNotification,
  CollegeNotificationDraft,
  CollegeNotificationPriority,
  CollegeNotificationType,
} from '../api/notifications';

type CollegeNotificationsContextValue = {
  notifications: CollegeNotification[];
  unreadCount: number;
  latestNotifications: CollegeNotification[];
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  createNotification: (notification: CollegeNotificationDraft) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const CollegeNotificationsContext = createContext<CollegeNotificationsContextValue | null>(null);

function sortNotifications(notifications: CollegeNotification[]) {
  return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function CollegeNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<CollegeNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshNotifications = useCallback(async () => {
    try {
      const { data } = await getNotifications();
      setNotifications(sortNotifications(data.data || []));
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const createNotification = useCallback(
    async (notification: CollegeNotificationDraft) => {
      await createNotificationApi(notification);
      await refreshNotifications();
    },
    [refreshNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
      try {
        await markNotificationAsRead(notificationId);
        await refreshNotifications();
      } catch (error) {
        console.error('Failed to mark notification as read', error);
        await refreshNotifications();
      }
    },
    [refreshNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    try {
      await markAllNotificationsAsRead();
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      latestNotifications: notifications.slice(0, 10),
      loading,
      refreshNotifications,
      createNotification,
      markAsRead,
      markAllAsRead,
    }),
    [createNotification, loading, markAllAsRead, markAsRead, notifications, refreshNotifications]
  );

  return (
    <CollegeNotificationsContext.Provider value={value}>
      {children}
    </CollegeNotificationsContext.Provider>
  );
}

export function useCollegeNotifications() {
  const context = useContext(CollegeNotificationsContext);
  if (!context) {
    throw new Error('useCollegeNotifications must be used within CollegeNotificationsProvider');
  }
  return context;
}

export function useOptionalCollegeNotifications() {
  return useContext(CollegeNotificationsContext);
}
