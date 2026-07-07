import { Link } from 'react-router-dom';
import {
  useCollegeNotifications,
  type CollegeNotification,
  type CollegeNotificationPriority,
} from '../../context/CollegeNotificationsContext';

const priorityLabel: Record<CollegeNotificationPriority, string> = {
  urgent: 'Urgent',
  reminder: 'Reminder',
  success: 'Success',
  info: 'Information',
};

function formatNotificationTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Recently';

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(value));
}

export function CollegeNotificationItem({
  notification,
  onMarkAsRead,
  dense = false,
}: {
  notification: CollegeNotification;
  onMarkAsRead: (notificationId: string) => void;
  dense?: boolean;
}) {
  return (
    <article className={`college-notification-item college-notification-item--${notification.priority}${notification.read ? '' : ' college-notification-item--unread'}${dense ? ' college-notification-item--dense' : ''}`}>
      <div className="college-notification-item__stripe" aria-hidden="true" />
      <div className="college-notification-item__body">
        <div className="college-notification-item__meta">
          <span className="college-notification-item__type">{notification.type}</span>
          <span className="college-notification-item__priority">{priorityLabel[notification.priority]}</span>
          <span className="college-notification-item__time">{formatNotificationTime(notification.createdAt)}</span>
        </div>
        <div className="college-notification-item__title-row">
          {!notification.read && <span className="college-notification-item__unread-dot" aria-label="Unread" />}
          <h3 className="college-notification-item__title">{notification.title}</h3>
        </div>
        <p className="college-notification-item__description">{notification.description}</p>
      </div>
      {!notification.read && (
        <button
          type="button"
          className="college-notification-item__read-button"
          onClick={() => onMarkAsRead(notification.id)}
        >
          Mark read
        </button>
      )}
    </article>
  );
}

export function CollegeNotificationsDropdown({ onNavigate }: { onNavigate: () => void }) {
  const { latestNotifications, unreadCount, markAsRead, markAllAsRead } = useCollegeNotifications();

  return (
    <div className="college-notifications-dropdown" role="menu" aria-label="College notifications">
      <div className="college-notifications-dropdown__header">
        <div>
          <p className="college-notifications-dropdown__eyebrow">College Portal</p>
          <h2 className="college-notifications-dropdown__title">Notifications</h2>
        </div>
        <button
          type="button"
          className="college-notifications-dropdown__mark-all"
          onClick={markAllAsRead}
          disabled={!unreadCount}
        >
          Mark All as Read
        </button>
      </div>
      <div className="college-notifications-dropdown__list">
        {latestNotifications.length ? (
          latestNotifications.slice(0, 8).map((notification) => (
            <CollegeNotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              dense
            />
          ))
        ) : (
          <p className="college-notifications-dropdown__empty">No notifications yet.</p>
        )}
      </div>
      <Link
        to="/dashboard/college/notifications"
        className="college-notifications-dropdown__view-all"
        onClick={onNavigate}
      >
        View All Notifications
      </Link>
    </div>
  );
}

export function CollegeNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useCollegeNotifications();

  return (
    <section className="college-notifications-page">
      <div className="college-notifications-page__header">
        <div>
          <p className="college-notifications-page__eyebrow">{unreadCount} unread</p>
          <h2 className="college-notifications-page__title">All Notifications</h2>
        </div>
        <button
          type="button"
          className="college-notifications-page__mark-all"
          onClick={markAllAsRead}
          disabled={!unreadCount}
        >
          Mark All as Read
        </button>
      </div>
      <div className="college-notifications-page__list">
        {notifications.map((notification) => (
          <CollegeNotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
          />
        ))}
      </div>
    </section>
  );
}

export function CollegeNotificationsPreview() {
  const { latestNotifications, markAsRead } = useCollegeNotifications();

  return (
    <section className="college-notifications-preview">
      <div className="college-notifications-preview__header">
        <h2 className="college-notifications-preview__title">Notifications</h2>
        <Link to="/dashboard/college/notifications" className="college-notifications-preview__link">
          View all
        </Link>
      </div>
      <div className="college-notifications-preview__list">
        {latestNotifications.slice(0, 5).map((notification) => (
          <CollegeNotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            dense
          />
        ))}
      </div>
    </section>
  );
}
