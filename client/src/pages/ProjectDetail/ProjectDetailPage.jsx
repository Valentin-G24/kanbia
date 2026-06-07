import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './ProjectDetailPage.module.scss';
import Button from '../../components/atoms/Button/Button';
import Badge from '../../components/atoms/Badge/Badge';
import Avatar from '../../components/atoms/Avatar/Avatar';
import Modal from '../../components/atoms/Modal/Modal';
import Input from '../../components/atoms/Input/Input';
import Select from '../../components/atoms/Select/Select';
import Spinner from '../../components/atoms/Spinner/Spinner';
import KanbanBoard from '../../components/organisms/KanbanBoard/KanbanBoard';
import { projectService } from '../../services/projectService';
import { epicService } from '../../services/epicService';
import { storyService } from '../../services/storyService';
import { userService } from '../../services/userService';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../hooks/useModal';
import { useForm } from '../../hooks/useForm';
import { Pencil, Trash2 } from 'lucide-react';
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUSES,
  PRIORITY_LABELS, ROLE_LABELS,
  TASK_STATUS_LABELS, TASK_STATUSES,
} from '../../utils/constants';

const TABS = [
  { id: 'Board', label: 'Tablero' },
  { id: 'Epics', label: 'Épicas' },
  { id: 'Members', label: 'Miembros' },
];

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'].map((p) => ({ value: p, label: PRIORITY_LABELS[p] }));
const STATUS_TASK_OPTIONS = TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }));
const STATUS_PROJECT_OPTIONS = PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }));
const ROLE_OPTIONS = ['admin', 'scrum_master', 'developer', 'guest'].map((r) => ({ value: r, label: ROLE_LABELS[r] }));
const EPIC_STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];
const iconBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '28px', height: '28px', borderRadius: '6px',
  background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px',
};

const toDateInput = (iso) => (iso ? iso.split('T')[0] : '');

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [project, setProject] = useState(null);
  const [epics, setEpics] = useState([]);
  const [stories, setStories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tab, setTab] = useState('Board');
  const [pageLoading, setPageLoading] = useState(true);
  const [memberSaving, setMemberSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { tasks, setTasks, createTask, updateTask, deleteTask } = useTasks({ projectId: id });

  // confirmation modal state
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const addTaskModal = useModal();
  const editTaskModal = useModal();
  const addEpicModal = useModal();
  const editEpicModal = useModal();
  const addMemberModal = useModal();
  const editProjectModal = useModal();

  const { values: taskForm, handleChange: handleTaskChange, setValues: setTaskValues, reset: resetTaskForm } = useForm({
    title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignee: '', story: '',
  });
  const { values: editTaskForm, handleChange: handleEditTaskChange, setValues: setEditTaskValues } = useForm({
    title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignee: '', story: '',
  });
  const [editingTaskId, setEditingTaskId] = useState(null);

  const { values: epicForm, handleChange: handleEpicChange } = useForm({
    title: '', description: '', priority: 'medium',
  });
  const { values: memberForm, handleChange: handleMemberChange, reset: resetMemberForm } = useForm({
    userId: '', role: 'developer',
  });
  const { values: epicEditForm, handleChange: handleEpicEditChange, setValues: setEpicEditValues } = useForm({
    title: '', description: '', priority: 'medium', status: 'backlog',
  });
  const [editingEpicId, setEditingEpicId] = useState(null);
  const { values: editForm, handleChange: handleEditChange, setValues: setEditValues } = useForm({
    name: '', description: '', status: 'planning', startDate: '', targetDate: '',
  });

  useEffect(() => {
    Promise.all([
      projectService.getById(id),
      epicService.getByProject(id),
      userService.getAll(),
      storyService.getAll({ projectId: id }),
    ]).then(([pRes, eRes, uRes, sRes]) => {
      setProject(pRes.data.data);
      setEpics(eRes.data.data);
      setAllUsers(uRes.data.data);
      setStories(sRes.data.data);
    }).finally(() => setPageLoading(false));
  }, [id]);

  const canEdit = hasRole('admin', 'scrum_master');
  const isAdmin = hasRole('admin');

  const showConfirm = (message, onConfirm) => {
    setConfirmState({ open: true, message, onConfirm });
  };
  const closeConfirm = () => setConfirmState({ open: false, message: '', onConfirm: null });

  const nonMembers = allUsers.filter(
    (u) => !project?.members?.some((m) => m.user._id === u._id) && u._id !== project?.owner?._id
  );

  const openEditProject = () => {
    setEditValues({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: toDateInput(project.startDate),
      targetDate: toDateInput(project.targetDate),
    });
    editProjectModal.open();
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    const res = await projectService.update(id, editForm);
    setProject((prev) => ({ ...prev, ...res.data.data }));
    editProjectModal.close();
  };

  const handleDeleteProject = () => {
    showConfirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.', async () => {
      setDeleting(true);
      try {
        await projectService.remove(id);
        navigate('/projects');
      } finally {
        setDeleting(false);
        closeConfirm();
      }
    });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const data = { ...taskForm, project: id };
    if (!data.assignee) delete data.assignee;
    if (!data.dueDate) delete data.dueDate;
    if (!data.story) delete data.story;
    await createTask(data);
    resetTaskForm();
    addTaskModal.close();
  };

  const openEditTask = (task) => {
    setEditingTaskId(task._id);
    setEditTaskValues({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: toDateInput(task.dueDate),
      assignee: task.assignee?._id || '',
      story: task.story?._id || '',
    });
    editTaskModal.open();
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    const data = { ...editTaskForm };
    if (!data.assignee) delete data.assignee;
    if (!data.dueDate) delete data.dueDate;
    if (!data.story) delete data.story;
    await updateTask(editingTaskId, data);
    editTaskModal.close();
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId) => {
    showConfirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.', async () => {
      await deleteTask(taskId);
      closeConfirm();
    });
  };

  const handleAddEpic = async (e) => {
    e.preventDefault();
    const res = await epicService.create(id, epicForm);
    setEpics((prev) => [res.data.data, ...prev]);
    addEpicModal.close();
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberForm.userId) return;
    setMemberSaving(true);
    try {
      const res = await projectService.addMember(id, { userId: memberForm.userId, role: memberForm.role });
      setProject(res.data.data);
      resetMemberForm();
      addMemberModal.close();
    } catch (err) {
      showConfirm(err.response?.data?.message || 'Error al agregar miembro', closeConfirm);
    } finally {
      setMemberSaving(false);
    }
  };

  const handleRemoveMember = (userId) => {
    showConfirm('¿Eliminar a este miembro del proyecto?', async () => {
      try {
        const res = await projectService.removeMember(id, userId);
        setProject(res.data.data);
      } catch (err) {
        showConfirm(err.response?.data?.message || 'Error al eliminar miembro', closeConfirm);
      }
      closeConfirm();
    });
  };

  const openEditEpic = (epic) => {
    setEditingEpicId(epic._id);
    setEpicEditValues({ title: epic.title, description: epic.description || '', priority: epic.priority, status: epic.status });
    editEpicModal.open();
  };

  const handleUpdateEpic = async (e) => {
    e.preventDefault();
    const res = await epicService.update(editingEpicId, epicEditForm);
    setEpics((prev) => prev.map((ep) => (ep._id === editingEpicId ? res.data.data : ep)));
    editEpicModal.close();
    setEditingEpicId(null);
  };

  const handleDeleteEpic = (epicId) => {
    showConfirm('¿Eliminar esta épica? Esta acción no se puede deshacer.', async () => {
      await epicService.remove(epicId);
      setEpics((prev) => prev.filter((ep) => ep._id !== epicId));
      closeConfirm();
    });
  };

  const userOptions = allUsers.map((u) => ({ value: u._id, label: u.name }));
  const storyOptions = stories.map((s) => ({ value: s._id, label: s.title }));
  const nonMemberOptions = nonMembers.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` }));

  if (pageLoading) return <Spinner center size="lg" />;
  if (!project) return <p>Proyecto no encontrado</p>;

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link to="/projects">Proyectos</Link>
          <span>/</span>
          <span>{project.name}</span>
        </div>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{project.name}</h1>
          <div className={styles.actions}>
            <Badge label={PROJECT_STATUS_LABELS[project.status]} value={project.status} />
            {isAdmin && (
              <>
                <Button variant="secondary" size="sm" onClick={openEditProject}>
                  <Pencil size={13} style={{ marginRight: 4 }} /> Editar
                </Button>
                <Button variant="danger" size="sm" onClick={handleDeleteProject} loading={deleting}>
                  <Trash2 size={13} style={{ marginRight: 4 }} /> Eliminar
                </Button>
              </>
            )}
          </div>
        </div>
        {project.description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {project.description}
          </p>
        )}
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={[styles.tab, tab === t.id && styles.active].filter(Boolean).join(' ')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'Board' && (
        <KanbanBoard
          tasks={tasks}
          setTasks={setTasks}
          onCardClick={() => {}}
          onAddTask={(status) => {
            setTaskValues((p) => ({ ...p, status }));
            addTaskModal.open();
          }}
          onDeleteTask={handleDeleteTask}
          onEditTask={openEditTask}
          canEdit={canEdit}
          currentUser={user}
        />
      )}

      {tab === 'Epics' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Épicas ({epics.length})</h2>
            {canEdit && (
              <Button size="sm" onClick={() => addEpicModal.open()}>+ Agregar épica</Button>
            )}
          </div>
          <div className={styles.epicList}>
            {epics.map((epic) => (
              <Link key={epic._id} to={`/projects/${id}/epics/${epic._id}`} className={styles.epicCard}>
                <div className={styles.epicRow}>
                  <span className={styles.epicTitle}>{epic.title}</span>
                  <Badge label={PRIORITY_LABELS[epic.priority]} type="priority" value={epic.priority} />
                  <Badge label={epic.status} value={epic.status} />
                  {epic.assignee && <Avatar user={epic.assignee} size="sm" />}
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditEpic(epic); }}
                        style={iconBtnStyle}
                        title="Editar épica"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteEpic(epic._id); }}
                        style={{ ...iconBtnStyle, color: '#f87171' }}
                        title="Eliminar épica"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {epics.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                Sin épicas aún
              </p>
            )}
          </div>
        </div>
      )}

      {tab === 'Members' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Miembros ({project.members?.length || 0})</h2>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => addMemberModal.open()}
                disabled={nonMembers.length === 0}
                title={nonMembers.length === 0 ? 'Todos los usuarios ya son miembros' : undefined}
              >
                + Agregar miembro
              </Button>
            )}
          </div>

          <div className={styles.membersList} style={{ marginTop: '1rem' }}>
            {project.owner && (
              <div className={styles.memberRow}>
                <div className={styles.memberInfo}>
                  <Avatar user={project.owner} size="md" />
                  <div>
                    <div className={styles.memberName}>{project.owner.name}</div>
                    <div className={styles.memberEmail}>{project.owner.email}</div>
                  </div>
                </div>
                <Badge label="Propietario" value="in_progress" />
              </div>
            )}

            {project.members?.map((m) => (
              <div key={m.user._id} className={styles.memberRow}>
                <div className={styles.memberInfo}>
                  <Avatar user={m.user} size="md" />
                  <div>
                    <div className={styles.memberName}>{m.user.name}</div>
                    <div className={styles.memberEmail}>{m.user.email}</div>
                  </div>
                </div>
                <Badge label={ROLE_LABELS[m.role] || m.role} value={m.role} />
                {isAdmin && (
                  <button
                    onClick={() => handleRemoveMember(m.user._id)}
                    style={{
                      marginLeft: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}

            {project.members?.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                Sin miembros aún. Agregá colaboradores al proyecto.
              </p>
            )}
          </div>
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
        </form>
      </Modal>

      {/* Modal: Editar proyecto */}
      <Modal
        isOpen={editProjectModal.isOpen}
        onClose={editProjectModal.close}
        title="Editar proyecto"
        footer={
          <>
            <Button variant="secondary" onClick={editProjectModal.close}>Cancelar</Button>
            <Button onClick={handleUpdateProject}>Guardar cambios</Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleUpdateProject}>
          <Input label="Nombre del proyecto" name="name" value={editForm.name} onChange={handleEditChange} required />
          <Input label="Descripción" name="description" value={editForm.description} onChange={handleEditChange} />
          <Select label="Estado" name="status" value={editForm.status} onChange={handleEditChange} options={STATUS_PROJECT_OPTIONS} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Fecha de inicio" name="startDate" type="date" value={editForm.startDate} onChange={handleEditChange} />
            <Input label="Fecha objetivo" name="targetDate" type="date" value={editForm.targetDate} onChange={handleEditChange} />
          </div>
        </form>
      </Modal>

      {/* Modal: Agregar tarea */}
      <Modal
        isOpen={addTaskModal.isOpen}
        onClose={addTaskModal.close}
        title="Agregar tarea"
        footer={
          <>
            <Button variant="secondary" onClick={addTaskModal.close}>Cancelar</Button>
            <Button onClick={handleAddTask}>Agregar</Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleAddTask}>
          <Input label="Título" name="title" value={taskForm.title} onChange={handleTaskChange} required />
          <Input label="Descripción" name="description" value={taskForm.description} onChange={handleTaskChange} />
          <Select label="Prioridad" name="priority" value={taskForm.priority} onChange={handleTaskChange} options={PRIORITY_OPTIONS} />
          <Select label="Estado" name="status" value={taskForm.status} onChange={handleTaskChange} options={STATUS_TASK_OPTIONS} />
          <Select label="Historia de usuario" name="story" value={taskForm.story} onChange={handleTaskChange} options={storyOptions} placeholder="Sin historia (opcional)" />
          <Select label="Responsable" name="assignee" value={taskForm.assignee} onChange={handleTaskChange} options={userOptions} placeholder="Sin asignar" />
          <Input label="Fecha límite" name="dueDate" type="date" value={taskForm.dueDate} onChange={handleTaskChange} />
        </form>
      </Modal>

      {/* Modal: Editar tarea */}
      <Modal
        isOpen={editTaskModal.isOpen}
        onClose={editTaskModal.close}
        title="Editar tarea"
        footer={
          <>
            <Button variant="secondary" onClick={editTaskModal.close}>Cancelar</Button>
            <Button onClick={handleUpdateTask}>Guardar cambios</Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleUpdateTask}>
          <Input label="Título" name="title" value={editTaskForm.title} onChange={handleEditTaskChange} required />
          <Input label="Descripción" name="description" value={editTaskForm.description} onChange={handleEditTaskChange} />
          <Select label="Prioridad" name="priority" value={editTaskForm.priority} onChange={handleEditTaskChange} options={PRIORITY_OPTIONS} />
          <Select label="Estado" name="status" value={editTaskForm.status} onChange={handleEditTaskChange} options={STATUS_TASK_OPTIONS} />
          <Select label="Historia de usuario" name="story" value={editTaskForm.story} onChange={handleEditTaskChange} options={storyOptions} placeholder="Sin historia (opcional)" />
          <Select label="Responsable" name="assignee" value={editTaskForm.assignee} onChange={handleEditTaskChange} options={userOptions} placeholder="Sin asignar" />
          <Input label="Fecha límite" name="dueDate" type="date" value={editTaskForm.dueDate} onChange={handleEditTaskChange} />
        </form>
      </Modal>

      {/* Modal: Agregar épica */}
      <Modal
        isOpen={addEpicModal.isOpen}
        onClose={addEpicModal.close}
        title="Agregar épica"
        footer={
          <>
            <Button variant="secondary" onClick={addEpicModal.close}>Cancelar</Button>
            <Button onClick={handleAddEpic}>Agregar</Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleAddEpic}>
          <Input label="Título" name="title" value={epicForm.title} onChange={handleEpicChange} required />
          <Input label="Descripción" name="description" value={epicForm.description} onChange={handleEpicChange} />
          <Select label="Prioridad" name="priority" value={epicForm.priority} onChange={handleEpicChange} options={PRIORITY_OPTIONS} />
        </form>
      </Modal>

      {/* Modal: Agregar miembro */}
      <Modal
        isOpen={addMemberModal.isOpen}
        onClose={addMemberModal.close}
        title="Agregar miembro"
        footer={
          <>
            <Button variant="secondary" onClick={addMemberModal.close}>Cancelar</Button>
            <Button onClick={handleAddMember} loading={memberSaving} disabled={!memberForm.userId}>
              Agregar
            </Button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={handleAddMember}>
          <Select
            label="Usuario"
            name="userId"
            value={memberForm.userId}
            onChange={handleMemberChange}
            options={nonMemberOptions}
            placeholder="Seleccionar usuario..."
          />
          <Select
            label="Rol en el proyecto"
            name="role"
            value={memberForm.role}
            onChange={handleMemberChange}
            options={ROLE_OPTIONS}
          />
        </form>
      </Modal>
    </div>
  );
}
