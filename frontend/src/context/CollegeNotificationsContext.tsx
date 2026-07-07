import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
  type: CollegeNotificationType;
  title: string;
  description: string;
  createdAt: string;
  priority: CollegeNotificationPriority;
  read: boolean;
};

type CollegeNotificationDraft = Omit<CollegeNotification, 'id' | 'createdAt' | 'read'> & {
  id?: string;
  createdAt?: string;
  read?: boolean;
};

type CollegeNotificationsContextValue = {
  notifications: CollegeNotification[];
  unreadCount: number;
  latestNotifications: CollegeNotification[];
  addNotification: (notification: CollegeNotificationDraft) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
};

const STORAGE_KEY = 'ams-college-notifications';
export const COLLEGE_NOTIFICATION_EVENT = 'ams:college-notification';

const now = Date.now();

const seedNotifications: CollegeNotification[] = [
  {
    id: 'seed-new-application',
    type: 'Application',
    title: 'New application submitted',
    description: 'A student submitted an admission application for review.',
    createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
    priority: 'urgent',
    read: false,
  },
  {
    id: 'seed-profile-approved',
    type: 'Profile',
    title: 'Profile verification approved',
    description: 'Your public college profile is visible to students.',
    createdAt: new Date(now - 38 * 60 * 1000).toISOString(),
    priority: 'success',
    read: false,
  },
  {
    id: 'seed-interested-student',
    type: 'Interested Student',
    title: 'New interested student',
    description: 'A student shortlisted your college and may need follow-up.',
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'info',
    read: false,
  },
  {
    id: 'seed-course-reminder',
    type: 'Course',
    title: 'Course intake needs review',
    description: 'Confirm course seats and fees before the next admission cycle.',
    createdAt: new Date(now - 7 * 60 * 60 * 1000).toISOString(),
    priority: 'reminder',
    read: true,
  },
  {
    id: 'seed-notice-published',
    type: 'Notice',
    title: 'Notice published successfully',
    description: 'Your latest admission notice is now available to students.',
    createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    priority: 'success',
    read: true,
  },
  {
    id: 'seed-system-window',
    type: 'System',
    title: 'Maintenance window scheduled',
    description: 'Portal services may be slower during scheduled maintenance.',
    createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'info',
    read: true,
  },
];

const CollegeNotificationsContext = createContext<CollegeNotificationsContextValue | null>(null);

function sortNotifications(notifications: CollegeNotification[]) {
  return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function readStoredNotifications() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return seedNotifications;
    const parsed = JSON.parse(value) as CollegeNotification[];
    return Array.isArray(parsed) && parsed.length ? parsed : seedNotifications;
  } catch {
    return seedNotifications;
  }
}

function buildNotification(notification: CollegeNotificationDraft): CollegeNotification {
  return {
    ...notification,
    id: notification.id ?? `college-notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: notification.createdAt ?? new Date().toISOString(),
    read: notification.read ?? false,
  };
}

export function CollegeNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<CollegeNotification[]>(() => sortNotifications(readStoredNotifications()));

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((notification: CollegeNotificationDraft) => {
    const nextNotification = buildNotification(notification);
    setNotifications((current) => sortNotifications([nextNotification, ...current.filter((item) => item.id !== nextNotification.id)]));
  }, []);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const notification = (event as CustomEvent<CollegeNotificationDraft>).detail;
      if (notification?.title) addNotification(notification);
    };

    window.addEventListener(COLLEGE_NOTIFICATION_EVENT, handleNotification);
    return () => window.removeEventListener(COLLEGE_NOTIFICATION_EVENT, handleNotification);
  }, [addNotification]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      latestNotifications: notifications.slice(0, 10),
      addNotification,
      markAsRead,
      markAllAsRead,
    }),
    [addNotification, markAllAsRead, markAsRead, notifications]
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

export function publishCollegeNotification(notification: CollegeNotificationDraft) {
  window.dispatchEvent(new CustomEvent(COLLEGE_NOTIFICATION_EVENT, { detail: notification }));
}
