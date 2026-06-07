import styles from './Badge.module.scss';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../../utils/constants';

const ALPHA = '22';

export default function Badge({ label, type = 'status', value }) {
  const colorMap = type === 'priority' ? PRIORITY_COLORS : STATUS_COLORS;
  const color = colorMap[value] || '#64748b';

  return (
    <span
      className={styles.badge}
      style={{
        color,
        backgroundColor: `${color}${ALPHA}`,
        border: `1px solid ${color}44`,
      }}
    >
      <span className={styles.dot} style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
