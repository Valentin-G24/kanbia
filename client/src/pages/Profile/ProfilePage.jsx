import { useState } from 'react';
import styles from './ProfilePage.module.scss';
import Avatar from '../../components/atoms/Avatar/Avatar';
import Input from '../../components/atoms/Input/Input';
import Button from '../../components/atoms/Button/Button';
import Badge from '../../components/atoms/Badge/Badge';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { ROLE_LABELS } from '../../utils/constants';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await authService.updateProfile(form);
      updateUser(form);
      setMsg('Perfil actualizado correctamente.');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePwdSave = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    setMsg('');
    setError('');
    try {
      await authService.changePassword(pwdForm);
      setMsg('Contraseña actualizada correctamente.');
      setPwdForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mi perfil</h1>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.avatarSection}>
            <Avatar user={user} size="xl" />
            <div>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userEmail}>{user?.email}</div>
              <div style={{ marginTop: '0.5rem' }}>
                <Badge label={ROLE_LABELS[user?.role]} value={user?.role} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Editar perfil</h2>
          {msg && <div className={styles.success}>{msg}</div>}
          {error && <div className={styles.error}>{error}</div>}
          <form className={styles.form} onSubmit={handleProfileSave}>
            <Input
              label="Nombre"
              name="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              label="URL de avatar"
              name="avatar"
              value={form.avatar}
              onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.value }))}
              placeholder="https://..."
            />
            <Button type="submit" loading={saving}>Guardar cambios</Button>
          </form>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Cambiar contraseña</h2>
          <form className={styles.form} onSubmit={handlePwdSave}>
            <Input
              label="Contraseña actual"
              name="currentPassword"
              type="password"
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
            />
            <Input
              label="Nueva contraseña"
              name="newPassword"
              type="password"
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
            />
            <Button type="submit" loading={savingPwd}>Actualizar contraseña</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
