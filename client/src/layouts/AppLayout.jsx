import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AppLayout.module.scss';
import Sidebar from '../components/organisms/Sidebar/Sidebar';
import Navbar from '../components/organisms/Navbar/Navbar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <Sidebar isOpen={sidebarOpen} />

      <div
        className={[styles.overlay, sidebarOpen && styles.visible].filter(Boolean).join(' ')}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={styles.main}>
        <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
