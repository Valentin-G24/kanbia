import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import styles from './ProjectsPage.module.scss';
import Button from '../../components/atoms/Button/Button';
import Badge from '../../components/atoms/Badge/Badge';
import Avatar from '../../components/atoms/Avatar/Avatar';
import Modal from '../../components/atoms/Modal/Modal';
import Input from '../../components/atoms/Input/Input';
import Select from '../../components/atoms/Select/Select';
import Spinner from '../../components/atoms/Spinner/Spinner';
import SearchBar from '../../components/molecules/SearchBar/SearchBar';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../context/AuthContext';
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }));
const EMPTY_FORM = { name: '', description: '', status: 'planning', startDate: '', targetDate: '' };

const toDateInput = (iso) => (iso ? iso.split('T')[0] : '');

export default function ProjectsPage() {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects();
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const isAdmin = hasRole('admin');

  const showConfirm = (message, onConfirm) => setConfirmState({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirmState({ open: false, message: '', onConfirm: null });

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Create ──
  const handleCreateChange = (e) =>
    setCreateForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createProject(createForm);
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──
  const openEdit = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(project._id);
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: toDateInput(project.startDate),
      targetDate: toDateInput(project.targetDate),
    });
    setEditOpen(true);
  };

  const handleEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateProject(editingId, editForm);
      setEditOpen(false);
      setEditingId(null);
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete ──
  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    showConfirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.', async () => {
      setDeletingId(id);
      try {
        await deleteProject(id);
      } finally {
        setDeletingId(null);
        closeConfirm();
      }
    });
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Proyectos</h1>
        <div className={styles.controls}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar proyectos..." />
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)}>+ Nuevo proyecto</Button>
          )}
        </div>
      </div>

      {loading ? (
        <Spinner center />
      ) : (
        <div className={styles.grid}>
          {filtered.length === 0 && (
            <div className={styles.empty}>No se encontraron proyectos</div>
          )}
          {filtered.map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{project.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge label={PROJECT_STATUS_LABELS[project.status]} value={project.status} />
                  {isAdmin && (
                    <div className={styles.cardActions}>
                      <button
                        className={styles.cardActionBtn}
                        onClick={(e) => openEdit(e, project)}
                        title="Editar proyecto"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={`${styles.cardActionBtn} ${styles.danger}`}
                        onClick={(e) => handleDelete(e, project._id)}
                        disabled={deletingId === project._id}
                        title="Eliminar proyecto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className={styles.cardDesc}>{project.description || 'Sin descripción'}</p>

              <div className={styles.cardFooter}>
                <span>{formatDate(project.startDate)} → {formatDate(project.targetDate)}</span>
                <div className={styles.members}>
                  {project.members?.slice(0, 3).map((m) => (
                    <Avatar key={m.user._id} user={m.user} size="sm" />
                  ))}
                  {project.members?.length > 3 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                      +{project.members.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal: Crear proyecto */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear proyecto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={creating}>Crear</Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleCreate}>
          <Input label="Nombre del proyecto" name="name" value={createForm.name} onChange={handleCreateChange} required />
          <Input label="Descripción" name="description" value={createForm.description} onChange={handleCreateChange} />
          <Select label="Estado" name="status" value={createForm.status} onChange={handleCreateChange} options={STATUS_OPTIONS} />
          <div className={styles.formRow}>
            <Input label="Fecha de inicio" name="startDate" type="date" value={createForm.startDate} onChange={handleCreateChange} />
            <Input label="Fecha objetivo" name="targetDate" type="date" value={createForm.targetDate} onChange={handleCreateChange} />
          </div>
        </form>
      </Modal>

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

      {/* Modal: Editar proyecto */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar proyecto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} loading={updating}>Guardar cambios</Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleUpdate}>
          <Input label="Nombre del proyecto" name="name" value={editForm.name} onChange={handleEditChange} required />
          <Input label="Descripción" name="description" value={editForm.description} onChange={handleEditChange} />
          <Select label="Estado" name="status" value={editForm.status} onChange={handleEditChange} options={STATUS_OPTIONS} />
          <div className={styles.formRow}>
            <Input label="Fecha de inicio" name="startDate" type="date" value={editForm.startDate} onChange={handleEditChange} />
            <Input label="Fecha objetivo" name="targetDate" type="date" value={editForm.targetDate} onChange={handleEditChange} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
