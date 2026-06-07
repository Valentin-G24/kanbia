import styles from './Select.module.scss';

export default function Select({ label, name, value, onChange, options = [], placeholder, disabled }) {
  return (
    <div className={styles.wrapper}>
      {label && <label htmlFor={name} className={styles.label}>{label}</label>}
      <select id={name} name={name} value={value} onChange={onChange} disabled={disabled} className={styles.select}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
