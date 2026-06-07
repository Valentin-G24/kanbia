import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import styles from './KanbanBoard.module.scss';
import TaskCard from '../../molecules/TaskCard/TaskCard';
import { TASK_STATUSES, TASK_STATUS_LABELS, STATUS_COLORS } from '../../../utils/constants';
import { taskService } from '../../../services/taskService';

export default function KanbanBoard({ tasks, setTasks, onCardClick, onAddTask, onDeleteTask, onEditTask, canEdit, currentUser }) {
  const columns = TASK_STATUSES.map((status) => ({
    id: status,
    label: TASK_STATUS_LABELS[status],
    color: STATUS_COLORS[status],
    tasks: tasks.filter((t) => t.status === status),
  }));

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;

    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await taskService.updateStatus(draggableId, newStatus);
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t._id === draggableId ? { ...t, status: source.droppableId } : t))
      );
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={styles.board}>
        {columns.map((col) => (
          <div key={col.id} className={styles.column}>
            <div className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span className={styles.dot} style={{ background: col.color }} />
                {col.label}
                <span className={styles.count}>{col.tasks.length}</span>
              </div>
              {canEdit && (
                <button className={styles.addBtn} onClick={() => onAddTask?.(col.id)} title="Agregar tarea">
                  <Plus size={14} />
                </button>
              )}
            </div>

            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={[styles.droppable, snapshot.isDraggingOver && styles.draggingOver]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {col.tasks.length === 0 && !snapshot.isDraggingOver && (
                    <div className={styles.empty}>Arrastrá tareas aquí</div>
                  )}
                  {col.tasks.map((task, index) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      index={index}
                      onClick={onCardClick}
                      onDelete={onDeleteTask}
                      onEdit={onEditTask}
                      canEdit={canEdit}
                      currentUser={currentUser}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
