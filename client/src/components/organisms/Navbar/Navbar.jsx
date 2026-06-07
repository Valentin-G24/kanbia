import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import styles from './Navbar.module.scss';
import Avatar from '../../atoms/Avatar/Avatar';
import NotificationItem from '../../molecules/NotificationItem/NotificationItem';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNotifications } from '../../../context/NotificationContext';

export default function Navbar({ onMenuToggle }) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markRead, markAllRead } =
    useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifOpen = () => {
    setNotifOpen((v) => !v);
    if (!notifOpen) fetchNotifications();
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button className={styles.hamburger} onClick={onMenuToggle} aria-label="Menú">
          <Menu size={20} />
        </button>
      </div>

      <div className={styles.right}>
        {/* Theme toggle switch */}
        <button
          className={styles.themeSwitch}
          onClick={toggle}
          aria-label="Cambiar tema"
          title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          <Sun size={12} className={styles.switchIconLeft} />
          <span className={`${styles.switchTrack} ${theme === 'light' ? styles.switchOn : ''}`}>
            <span className={styles.switchThumb} />
          </span>
          <Moon size={12} className={styles.switchIconRight} />
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className={styles.iconBtn} onClick={handleNotifOpen} aria-label="Notificaciones">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className={styles.notifPanel}>
              <div className={styles.notifHeader}>
                <span>Notificaciones</span>
                {unreadCount > 0 && (
                  <button className={styles.markAll} onClick={markAllRead}>
                    Marcar todo como leído
                  </button>
                )}
              </div>
              <div className={styles.notifScroll}>
                {notifications.length === 0 ? (
                  <p className={styles.notifEmpty}>Sin notificaciones</p>
                ) : (
                  notifications.map((n) => (
                    <NotificationItem key={n._id} notification={n} onClick={(notif) => {
                      markRead(notif._id);
                      setNotifOpen(false);
                    }} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info */}
        <Link to="/profile" className={styles.userChip}>
          <Avatar user={user} size="sm" />
          <div className={styles.userText}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
