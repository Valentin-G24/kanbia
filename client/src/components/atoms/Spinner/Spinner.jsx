import styles from './Spinner.module.scss';

export default function Spinner({ size = 'md', center }) {
  const el = <span className={[styles.spinner, styles[size]].join(' ')} />;
  return center ? <div className={styles.center}>{el}</div> : el;
}
