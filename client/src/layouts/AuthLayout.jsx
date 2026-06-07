import { Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';
import styles from './AuthLayout.module.scss';

export default function AuthLayout() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.box}>
        <div className={styles.logo}>
          <span className={styles.logoName}>Kan</span><span className={styles.logoName2}>Bia</span><sup className={styles.marca}>VG</sup>
        </div>
        <div className={styles.card}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
