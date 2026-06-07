import styles from './Button.module.scss';
import Spinner from '../Spinner/Spinner';

export default function Button({
  children,
  variant = 'primary',
  size,
  fullWidth,
  loading,
  disabled,
  onClick,
  type = 'button',
  className = '',
}) {
  const cls = [
    styles.btn,
    styles[variant],
    size && styles[size],
    fullWidth && styles.full,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled || loading}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
