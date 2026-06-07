import styles from './Avatar.module.scss';
import { getInitials } from '../../../utils/formatters';

export default function Avatar({ user, size = 'md' }) {
  const initials = getInitials(user?.name);
  return (
    <div className={[styles.avatar, styles[size]].join(' ')} title={user?.name}>
      {user?.avatar ? (
        <img src={user.avatar} alt={user.name} className={styles.img} />
      ) : (
        initials
      )}
    </div>
  );
}
