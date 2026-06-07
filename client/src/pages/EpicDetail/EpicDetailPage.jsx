import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from '../ProjectDetail/ProjectDetailPage.module.scss';
import Badge from '../../components/atoms/Badge/Badge';
import Avatar from '../../components/atoms/Avatar/Avatar';
import Button from '../../components/atoms/Button/Button';
import Modal from '../../components/atoms/Modal/Modal';
import Input from '../../components/atoms/Input/Input';
import Select from '../../components/atoms/Select/Select';
import Spinner from '../../components/atoms/Spinner/Spinner';
import { epicService } from '../../services/epicService';
import { storyService } from '../../services/storyService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../hooks/useModal';
import { useForm } from '../../hooks/useForm';
import { Pencil, Trash2 } from 'lucide-react';
import { PRIORITY_LABELS } from '../../utils/constants';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'].map((p) => ({ value: p, label: PRIORITY_LABELS[p] }));

const EPIC_STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const STORY_STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'review', label: 'En revisión' },
  { value: 'done', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function EpicDetailPage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [epic, setEpic] = useState(null);
  const [stories, setStories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const addStoryModal = useModal();
  const editEpicModal = useModal();
  const editStoryModal = useModal();

  const { values: storyForm, handleChange: handleStoryChange, setValues: setStoryValues } = useForm({
    title: '', description: '', acceptanceCriteria: '', storyPoints: 0, priority: 'medium', assignee: '',
  });
  const { values: epicEditForm, handleChange: handleEpicEditChange, setValues: setEpicEditValues } = useForm({
    title: '', description: '', priority: 'medium', status: 'backlog', assignee: '',
  });
  const { values: storyEditForm, handleChange: handleStoryEditChange, setValues: setStoryEditValues } = useForm({
    title: '', description: '', acceptanceCriteria: '', storyPoints: 0, priority: 'medium', status: 'backlog', assignee: '',
  });
  const [editingStoryId, setEditingStoryId] = useState(null);

  useEffect(() => {
    Promise.all([
      epicService.getById(id),
      storyService.getAll({ epicId: id }),
      userService.getAll(),
    ]).then(([eRes, sRes, uRes]) => {
      setEpic(eRes.data.data);
      setStories(sRes.data.data);
      setAllUsers(uRes.data.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const canEdit = hasRole('admin', 'scrum_master');
  const userOptions = allUsers.map((u) => ({ value: u._id, label: u.name }));

  const showConfirm = (message, onConfirm) => {
    setConfirmState({ open: true, message, onConfirm });
  };
  const closeConfirm = () => setConfirmState({ open: false, message: '', onConfirm: null });

  // ── Épica ──
  const openEditEpic = () => {
    setEpicEditValues({
      title: epic.title,
      description: epic.description || '',
      priority: epic.priority,
      status: epic.status,
      assignee: epic.assignee?._id || '',
    });
    editEpicModal.open();
  };

  const handleUpdateEpic = async (e) => {
    e.preventDefault();
    const data = { ...epicEditForm };
    if (!data.assignee) delete data.assignee;
    const res = await epicService.update(id, data);
    setEpic(res.data.data);
    editEpicModal.close();
  };

  const handleDeleteEpic = () => {
    showConfirm('¿Eliminar esta épica? Esta acción no se puede deshacer.', async () => {
      setDeleting(true);
      try {
        await epicService.remove(id);
        navigate(`/projects/${projectId}`);
      } finally {
        setDeleting(false);
        closeConfirm();
      }
    });
  };

  // ── Historias ──
  const handleAddStory = async (e) => {
    e.preventDefault();
    const data = { ...storyForm, project: projectId, epic: id };
    if (!data.assignee) delete data.assignee;
    const res = await storyService.create(data);
    setStories((prev) => [res.data.data, ...prev]);
    addStoryModal.close();
    setStoryValues({ title: '', description: '', acceptanceCriteria: '', storyPoints: 0, priority: 'medium', assignee: '' });
  };

  const openEditStory = (e, story) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingStoryId(story._id);
    setStoryEditValues({
      title: story.title,
      description: story.description || '',
      acceptanceCriteria: story.acceptanceCriteria || '',
      storyPoints: story.storyPoints || 0,
      priority: story.priority,
      status: story.status,
      assignee: story.assignee?._id || '',
    });
    editStoryModal.open();
  };

  const handleUpdateStory = async (e) => {
    e.preventDefault();
    const data = { ...storyEditForm };
    if (!data.assignee) delete data.assignee;
    const res = await storyService.update(editingStoryId, data);
    setStories((prev) => prev.map((s) => (s._id === editingStoryId ? res.data.data : s)));
    editStoryModal.close();
    setEditingStoryId(null);
  };

  const handleDeleteStory = (e, storyId) => {
    e.preventDefault();
    e.stopPropagation();
    showConfirm('¿Eliminar esta historia? Esta acción no se puede deshacer.', async () => {
      await storyService.remove(storyId);
      setStories((prev) => prev.filter((s) => s._id !== storyId));
      closeConfirm();
    });
  };

  if (loading) return <Spinner center size="lg" />;
  if (!epic) return <p>Épica no encontrada</p>;

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link to="/projects">Proyectos</Link>
          <span>/</span>
          <Link to={`/projects/${projectId}`}>Proyecto</Link>
          <span>/</span>
          <span>{epic.title}</span>
        </div>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{epic.title}</h1>
          <div className={styles.actions}>
            <Badge label={PRIORITY_LABELS[epic.priority]} type="priority" value={epic.priority} />
            <Badge label={epic.status} value={epic.status} />
            {epic.assignee && <Avatar user={epic.assignee} size="md" />}
            {canEdit && (
              <>
                <Button variant="secondary" size="sm" onClick={openEditEpic}><Pencil size={13} style={{ marginRight: 4 }} /> Editar</Button>
                <Button variant="danger" size="sm" onClick={handleDeleteEpic} loading={deleting}><Trash2 size={13} style={{ marginRight: 4 }} /> Eliminar</Button>
              </>
            )}
          </div>
        </div>
        {epic.description && (
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            {epic.description}
          </p>
        )}
      </div>

      {/* Historias */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Historias de usuario ({stories.length})</h2>
        {canEdit && (
          <Button size="sm" onClick={() => addStoryModal.open()}>+ Agregar historia</Button>
        )}
      </div>

      <div className={styles.epicList} style={{ marginTop: '1rem' }}>
        {stories.map((story) => (
          <Link
            key={story._id}
            to={`/projects/${projectId}/stories/${story._id}`}
            className={styles.epicCard}
          >
            <div className={styles.epicRow}>
              <span className={styles.epicTitle}>{story.title}</span>
              <Badge label={PRIORITY_LABELS[story.priority]} type="priority" value={story.priority} />
              <Badge label={story.status} value={story.status} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '999px' }}>
                {story.storyPoints} pts
              </span>
              {story.assignee && <Avatar user={story.assignee} size="sm" />}
              {canEdit && (
                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                  <button
                    onClick={(e) => openEditStory(e, story)}
                    style={btnStyle}
                    title="Editar historia"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteStory(e, story._id)}
                    style={{ ...btnStyle, color: '#f87171' }}
                    title="Eliminar historia"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </Link>
        ))}
        {stories.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Sin historias aún</p>
        )}
      </div>

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

      {/* Modal: Editar épica */}
      <Modal
        isOpen={editEpicModal.isOpen}
        onClose={editEpicModal.close}
        title="Editar épica"
        footer={
          <>
            <Button variant="secondary" onClick={editEpicModal.close}>Cancelar</Button>
            <Button onClick={handleUpdateEpic}>Guardar cambios</Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleUpdateEpic}>
          <Input label="Título" name="title" value={epicEditForm.title} onChange={handleEpicEditChange} required />
          <Input label="Descripción" name="description" value={epicEditForm.description} onChange={handleEpicEditChange} />
          <Select label="Prioridad" name="priority" value={epicEditForm.priority} onChange={handleEpicEditChange} options={PRIORITY_OPTIONS} />
          <Select label="Estado" name="status" value={epicEditForm.status} onChange={handleEpicEditChange} options={EPIC_STATUS_OPTIONS} />
          <Select label="Responsable" name="assignee" value={epicEditForm.assignee} onChange={handleEpicEditChange} options={userOptions} placeholder="Sin asignar" />
        </form>
      </Modal>

      {/* Modal: Agregar historia */}
      <Modal
        isOpen={addStoryModal.isOpen}
        onClose={addStoryModal.close}
        title="Agregar historia de usuario"
        footer={
          <>
            <Button variant="secondary" onClick={addStoryModal.close}>Cancelar</Button>
            <Button onClick={handleAddStory}>Agregar</Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleAddStory}>
          <Input label="Título" name="title" value={storyForm.title} onChange={handleStoryChange} required />
          <Input label="Descripción" name="description" value={storyForm.description} onChange={handleStoryChange} />
          <Input label="Criterios de aceptación" name="acceptanceCriteria" value={storyForm.acceptanceCriteria} onChange={handleStoryChange} />
          <Input label="Story Points" name="storyPoints" type="number" value={storyForm.storyPoints} onChange={handleStoryChange} />
          <Select label="Prioridad" name="priority" value={storyForm.priority} onChange={handleStoryChange} options={PRIORITY_OPTIONS} />
          <Select label="Responsable" name="assignee" value={storyForm.assignee} onChange={handleStoryChange} options={userOptions} placeholder="Seleccionar usuario..." />
        </form>
      </Modal>

      {/* Modal: Editar historia */}
      <Modal
        isOpen={editStoryModal.isOpen}
        onClose={editStoryModal.close}
        title="Editar historia de usuario"
        footer={
          <>
            <Button variant="secondary" onClick={editStoryModal.close}>Cancelar</Button>
            <Button onClick={handleUpdateStory}>Guardar cambios</Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleUpdateStory}>
          <Input label="Título" name="title" value={storyEditForm.title} onChange={handleStoryEditChange} required />
          <Input label="Descripción" name="description" value={storyEditForm.description} onChange={handleStoryEditChange} />
          <Input label="Criterios de aceptación" name="acceptanceCriteria" value={storyEditForm.acceptanceCriteria} onChange={handleStoryEditChange} />
          <Input label="Story Points" name="storyPoints" type="number" value={storyEditForm.storyPoints} onChange={handleStoryEditChange} />
          <Select label="Prioridad" name="priority" value={storyEditForm.priority} onChange={handleStoryEditChange} options={PRIORITY_OPTIONS} />
          <Select label="Estado" name="status" value={storyEditForm.status} onChange={handleStoryEditChange} options={STORY_STATUS_OPTIONS} />
          <Select label="Responsable" name="assignee" value={storyEditForm.assignee} onChange={handleStoryEditChange} options={userOptions} placeholder="Sin asignar" />
        </form>
      </Modal>
    </div>
  );
}

const btnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background 150ms',
};
