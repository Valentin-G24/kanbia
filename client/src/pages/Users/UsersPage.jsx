import { useState, useEffect } from 'react';
import Avatar from '../../components/atoms/Avatar/Avatar';
import Badge from '../../components/atoms/Badge/Badge';
import Select from '../../components/atoms/Select/Select';
import Button from '../../components/atoms/Button/Button';
import Modal from '../../components/atoms/Modal/Modal';
import Spinner from '../../components/atoms/Spinner/Spinner';
import SearchBar from '../../components/molecules/SearchBar/SearchBar';
import { userService } from '../../services/userService';
import { ROLE_LABELS } from '../../utils/constants';
import styles from '../Projects/ProjectsPage.module.scss';

const ROLE_OPTIONS = ['admin', 'scrum_master', 'developer', 'guest'].map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  useEffect(() => {
    userService.getAll().then((res) => setUsers(res.data.data)).finally(() => setLoading(false));
  }, []);

  const showConfirm = (message, onConfirm) => setConfirmState({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirmState({ open: false, message: '', onConfirm: null });

  const handleRoleChange = async (userId, role) => {
    await userService.updateRole(userId, role);
    setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role } : u)));
  };

  const handleDeactivate = (userId) => {
    showConfirm('¿Desactivar este usuario?', async () => {
      await userService.deactivate(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      closeConfirm();
    });
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de usuarios</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar usuarios..." />
      </div>

      {loading ? (
        <Spinner center />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No se encontraron usuarios
            </p>
          )}
          {filtered.map((user) => (
            <div
              key={user._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem',
              }}
            >
              <Avatar user={user} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <div style={{ width: 180 }}>
                <Select
                  name={`role-${user._id}`}
                  value={user.role}
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  options={ROLE_OPTIONS}
                />
              </div>
              <Button variant="danger" size="sm" onClick={() => handleDeactivate(user._id)}>
                Desactivar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Confirmación */}
      <Modal
        isOpen={confirmState.open}
        onClose={closeConfirm}
        title="Confirmar acción"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeConfirm}>Cancelar</Button>
            <Button variant="danger" onClick={confirmState.onConfirm}>Confirmar</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{confirmState.message}</p>
      </Modal>
    </div>
  );
}
