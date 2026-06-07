import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/atoms/Input/Input';
import Button from '../../components/atoms/Button/Button';
import Select from '../../components/atoms/Select/Select';
import { useAuth } from '../../context/AuthContext';
import styles from '../Login/LoginPage.module.scss';

const ROLE_OPTIONS = [
  { value: 'developer', label: 'Desarrollador' },
  { value: 'scrum_master', label: 'Scrum Master' },
  { value: 'guest', label: 'Invitado' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'developer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Crear cuenta</h1>
      <p className={styles.subtitle}>Uníte a tu equipo en AgileFlow</p>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input label="Nombre completo" name="name" value={form.name} onChange={handleChange} placeholder="Juan Pérez" required />
        <Input label="Correo electrónico" name="email" type="email" value={form.email} onChange={handleChange} placeholder="vos@empresa.com" required />
        <Input label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required />
        <Select label="Rol" name="role" value={form.role} onChange={handleChange} options={ROLE_OPTIONS} />
        <Button type="submit" fullWidth loading={loading}>Crear cuenta</Button>
      </form>

      <p className={styles.footer}>
        ¿Ya tenés cuenta?
        <Link to="/login" className={styles.link}>Iniciá sesión</Link>
      </p>
    </div>
  );
}
