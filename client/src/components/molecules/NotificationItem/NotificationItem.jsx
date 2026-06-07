import styles from './NotificationItem.module.scss';
import { formatRelativeTime } from '../../../utils/formatters';

export default function NotificationItem({ notification, onClick }) {
  return (
    <div
      className={[styles.item, !notification.read && styles.unread].filter(Boolean).join(' ')}
      onClick={() => onClick?.(notification)}
    >
      <span className={[styles.dot, notification.read && styles.dotRead].filter(Boolean).join(' ')} />
      <div className={styles.content}>
        <p className={styles.message}>{notification.message}</p>
        <span className={styles.time}>{formatRelativeTime(notification.createdAt)}</span>
      </div>
    </div>
  );
}
