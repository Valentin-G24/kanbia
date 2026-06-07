import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CalendarDays, Users, Settings, LogOut } from 'lucide-react';
import styles from './Sidebar.module.scss';
import Modal from '../../atoms/Modal/Modal';
import Button from '../../atoms/Button/Button';
import { useAuth } from '../../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { to: '/projects', icon: FolderKanban, label: 'Proyectos' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
];

const ADMIN_ITEMS = [
  { to: '/users', icon: Users, label: 'Usuarios' },
];

export default function Sidebar({ isOpen }) {
  const { user, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <aside className={[styles.sidebar, isOpen && styles.open].filter(Boolean).join(' ')}>
        <div className={styles.logo}>
          <span className={styles.logoName}>Kan</span><span className={styles.logoName2}>Bia</span>
        </div>

        <nav className={styles.nav}>
          <span className={styles.section}>Principal</span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [styles.navItem, isActive && styles.active].filter(Boolean).join(' ')
                }
              >
                <Icon size={16} className={styles.icon} />
                {item.label}
              </NavLink>
            );
          })}

          {user?.role === 'admin' && (
            <>
              <span className={styles.section}>Administración</span>
              {ADMIN_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [styles.navItem, isActive && styles.active].filter(Boolean).join(' ')
                    }
                  >
                    <Icon size={16} className={styles.icon} />
                    {item.label}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        <div className={styles.footer}>
          <div className={styles.footerActions}>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                [styles.footerBtn, isActive && styles.active].filter(Boolean).join(' ')
              }
              title="Configuración"
            >
              <Settings size={16} />
              <span>Configuración</span>
            </NavLink>
            <button
              className={styles.footerBtn}
              onClick={() => setConfirmOpen(true)}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Cerrar sesión"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={logout}>Cerrar sesión</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ¿Estás seguro que querés cerrar sesión?
        </p>
      </Modal>
    </>
  );
}
