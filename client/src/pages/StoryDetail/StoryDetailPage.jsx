import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus } from 'lucide-react';
import styles from './StoryDetailPage.module.scss';
import Badge from '../../components/atoms/Badge/Badge';
import Avatar from '../../components/atoms/Avatar/Avatar';
import Button from '../../components/atoms/Button/Button';
import Modal from '../../components/atoms/Modal/Modal';
import Input from '../../components/atoms/Input/Input';
import Select from '../../components/atoms/Select/Select';
import Spinner from '../../components/atoms/Spinner/Spinner';
import { storyService } from '../../services/storyService';
import { commentService } from '../../services/commentService';
import { userService } from '../../services/userService';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../hooks/useModal';
import { useForm } from '../../hooks/useForm';
import { PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUSES, STATUS_COLORS } from '../../utils/constants';
import { formatRelativeTime, formatDate } from '../../utils/formatters';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'].map((p) => ({ value: p, label: PRIORITY_LABELS[p] }));
const TASK_STATUS_OPTIONS = TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }));

const STORY_STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'review', label: 'En revisión' },
  { value: 'done', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function StoryDetailPage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [story, setStory] = useState(null);
  const [comments, setComments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const editModal = useModal();
  const addTaskModal = useModal();

  const { values: editForm, handleChange: handleEditChange, setValues: setEditValues } = useForm({
    title: '', description: '', acceptanceCriteria: '', storyPoints: 0,
    priority: 'medium', status: 'backlog', assignee: '',
  });

  const { values: taskForm, handleChange: handleTaskChange, reset: resetTaskForm } = useForm({
    title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignee: '',
  });

  const canEdit = hasRole('admin', 'scrum_master');
  const isDeveloper = hasRole('developer');

  useEffect(() => {
    Promise.all([
      storyService.getById(id),
      commentService.getByEntity(id),
      userService.getAll(),
      taskService.getAll({ storyId: id }),
    ]).then(([sRes, cRes, uRes, tRes]) => {
      setStory(sRes.data.data);
      setComments(cRes.data.data);
      setAllUsers(uRes.data.data);
      setTasks(tRes.data.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const userOptions = allUsers.map((u) => ({ value: u._id, label: u.name }));

  const visibleTasks = isDeveloper
    ? tasks.filter((t) => t.assignee?._id === user?._id || t.assignee?._id === user?.id)
    : tasks;

  const showConfirm = (message, onConfirm) => setConfirmState({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirmState({ open: false, message: '', onConfirm: null });

  const openEdit = () => {
    setEditValues({
      title: story.title,
      description: story.description || '',
      acceptanceCriteria: story.acceptanceCriteria || '',
      storyPoints: story.storyPoints || 0,
      priority: story.priority,
      status: story.status,
      assignee: story.assignee?._id || '',
    });
    editModal.open();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const data = { ...editForm };
    if (!data.assignee) delete data.assignee;
    const res = await storyService.update(id, data);
    setStory(res.data.data);
    editModal.close();
  };

  const handleDelete = () => {
    showConfirm('¿Eliminar esta historia? Esta acción no se puede deshacer.', async () => {
      try {
        await storyService.remove(id);
        navigate(`/projects/${projectId}`);
      } finally {
        closeConfirm();
      }
    });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const data = {
      ...taskForm,
      project: projectId,
      story: id,
    };
    if (!data.assignee) delete data.assignee;
    if (!data.dueDate) delete data.dueDate;
    const res = await taskService.create(data);
    setTasks((prev) => [...prev, res.data.data]);
    resetTaskForm();
    addTaskModal.close();
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await commentService.create({ content: commentText, entityType: 'story', entityId: id });
      setComments((prev) => [...prev, res.data.data]);
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner center size="lg" />;
  if (!story) return <p>Historia no encontrada</p>;

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link to="/projects">Proyectos</Link>
          <span>/</span>
          <Link to={`/projects/${projectId}`}>Proyecto</Link>
          <span>/</span>
          <span>{story.title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 className={styles.title}>{story.title}</h1>
          {canEdit && (
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <Button variant="secondary" size="sm" onClick={openEdit}><Pencil size={13} style={{ marginRight: 4 }} /> Editar</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 size={13} style={{ marginRight: 4 }} /> Eliminar</Button>
            </div>
          )}
        </div>

        <div className={styles.meta}>
          <Badge label={PRIORITY_LABELS[story.priority]} type="priority" value={story.priority} />
          <Badge label={story.status} value={story.status} />
          <span style={{ fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '999px', color: 'var(--text-muted)' }}>
            {story.storyPoints} puntos
          </span>
          {story.assignee && <Avatar user={story.assignee} size="sm" />}
        </div>
      </div>

      <div className={styles.content}>
        <div>
          {story.description && (
            <div className={styles.card}>
              <p className={styles.cardTitle}>Descripción</p>
              <p className={styles.cardBody}>{story.description}</p>
            </div>
          )}

          {story.acceptanceCriteria && (
            <div className={styles.card}>
              <p className={styles.cardTitle}>Criterios de aceptación</p>
              <p className={styles.cardBody}>{story.acceptanceCriteria}</p>
            </div>
          )}

          {/* Tasks section */}
          <div className={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <p className={styles.cardTitle} style={{ margin: 0 }}>
                Tareas ({visibleTasks.length}{isDeveloper && tasks.length !== visibleTasks.length ? ` de ${tasks.length}` : ''})
              </p>
              {canEdit && (
                <Button size="sm" onClick={() => addTaskModal.open()}>
                  <Plus size={13} style={{ marginRight: 4 }} /> Agregar tarea
                </Button>
              )}
            </div>

            {visibleTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {isDeveloper ? 'No tenés tareas asignadas en esta historia.' : 'Sin tareas aún.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {visibleTasks.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                  return (
                    <div
                      key={task._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 0.875rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: STATUS_COLORS[task.status],
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{task.title}</span>
                      <Badge label={PRIORITY_LABELS[task.priority]} type="priority" value={task.priority} />
                      <Badge label={TASK_STATUS_LABELS[task.status]} value={task.status} />
                      {task.dueDate && (
                        <span style={{ fontSize: '0.75rem', color: isOverdue ? '#f87171' : 'var(--text-muted)' }}>
                          {isOverdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.assignee && <Avatar user={task.assignee} size="sm" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>Comentarios ({comments.length})</p>
            <div className={styles.comments}>
              {comments.map((c) => (
                <div key={c._id} className={styles.comment}>
                  <Avatar user={c.author} size="sm" />
                  <div className={styles.commentBody}>
                    <div className={styles.commentMeta}>
                      <span>{c.author?.name}</span>
                      <span className={styles.commentTime}>{formatRelativeTime(c.createdAt)}</span>
                    </div>
                    <p className={styles.commentText}>{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin comentarios aún.</p>
              )}
            </div>

            <div className={styles.commentForm}>
              <Avatar user={user} size="sm" />
              <textarea
                className={styles.commentInput}
                placeholder="Escribí un comentario..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button size="sm" onClick={handleComment} loading={submitting} disabled={!commentText.trim()}>
                Publicar
              </Button>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.card}>
            <p className={styles.cardTitle}>Detalles</p>
            <div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Estado</span>
                <Badge label={story.status} value={story.status} />
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Prioridad</span>
                <Badge label={PRIORITY_LABELS[story.priority]} type="priority" value={story.priority} />
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Story Points</span>
                <span>{story.storyPoints}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Responsable</span>
                {story.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Avatar user={story.assignee} size="sm" />
                    <span style={{ fontSize: '0.875rem' }}>{story.assignee.name}</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>
                )}
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tareas</span>
                <span style={{ fontSize: '0.875rem' }}>{tasks.length} total</span>
              </div>
            </div>
          </div>
        </div>
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

      {/* Modal: Agregar tarea */}
      <Modal
        isOpen={addTaskModal.isOpen}
        onClose={addTaskModal.close}
        title="Agregar tarea a esta historia"
        footer={
          <>
            <Button variant="secondary" onClick={addTaskModal.close}>Cancelar</Button>
            <Button onClick={handleAddTask}>Agregar</Button>
          </>
        }
      >
        <form style={{ display: 'grid', gap: '1rem' }} onSubmit={handleAddTask}>
          <Input label="Título" name="title" value={taskForm.title} onChange={handleTaskChange} required />
          <Input label="Descripción" name="description" value={taskForm.description} onChange={handleTaskChange} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select label="Prioridad" name="priority" value={taskForm.priority} onChange={handleTaskChange} options={PRIORITY_OPTIONS} />
            <Select label="Estado" name="status" value={taskForm.status} onChange={handleTaskChange} options={TASK_STATUS_OPTIONS} />
          </div>
          <Select label="Responsable" name="assignee" value={taskForm.assignee} onChange={handleTaskChange} options={userOptions} placeholder="Sin asignar" />
          <Input label="Fecha límite" name="dueDate" type="date" value={taskForm.dueDate} onChange={handleTaskChange} />
        </form>
      </Modal>

      {/* Modal: Editar historia */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        title="Editar historia de usuario"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={editModal.close}>Cancelar</Button>
            <Button onClick={handleUpdate}>Guardar cambios</Button>
          </>
        }
      >
        <form style={{ display: 'grid', gap: '1rem' }} onSubmit={handleUpdate}>
          <Input label="Título" name="title" value={editForm.title} onChange={handleEditChange} required />
          <Input label="Descripción" name="description" value={editForm.description} onChange={handleEditChange} />
          <Input label="Criterios de aceptación" name="acceptanceCriteria" value={editForm.acceptanceCriteria} onChange={handleEditChange} />
          <Input label="Story Points" name="storyPoints" type="number" value={editForm.storyPoints} onChange={handleEditChange} />
          <Select label="Prioridad" name="priority" value={editForm.priority} onChange={handleEditChange} options={PRIORITY_OPTIONS} />
          <Select label="Estado" name="status" value={editForm.status} onChange={handleEditChange} options={STORY_STATUS_OPTIONS} />
          <Select label="Responsable" name="assignee" value={editForm.assignee} onChange={handleEditChange} options={userOptions} placeholder="Sin asignar" />
        </form>
      </Modal>
    </div>
  );
}
