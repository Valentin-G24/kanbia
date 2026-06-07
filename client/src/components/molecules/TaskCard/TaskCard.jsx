import { Draggable } from '@hello-pangea/dnd';
import { Pencil, Trash2 } from 'lucide-react';
import styles from './TaskCard.module.scss';
import Badge from '../../atoms/Badge/Badge';
import Avatar from '../../atoms/Avatar/Avatar';
import { formatDate } from '../../../utils/formatters';
import { PRIORITY_LABELS } from '../../../utils/constants';

export default function TaskCard({ task, index, onClick, onDelete, onEdit, canEdit, currentUser }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDeveloper = currentUser?.role === 'developer';
  const isOwnTask = task.assignee?._id === currentUser?._id || task.assignee?._id === currentUser?.id;
  const canDrag = canEdit || (isDeveloper && isOwnTask);

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={!canDrag}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={styles.card}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.85 : 1,
            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : undefined,
          }}
          onClick={() => onClick?.(task)}
        >
          <div className={styles.title}>{task.title}</div>

          <div className={styles.meta}>
            <Badge
              label={PRIORITY_LABELS[task.priority]}
              type="priority"
              value={task.priority}
            />
            {task.story?.title && (
              <span className={styles.storyTag} title={`Historia: ${task.story.title}`}>
                {task.story.title}
              </span>
            )}
          </div>

          <div className={styles.footer}>
            {task.dueDate && (
              <span className={`${styles.due} ${isOverdue ? styles.overdue : ''}`}>
                {isOverdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
              </span>
            )}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: 'auto' }}>
              {canEdit && (
                <>
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                    title="Editar tarea"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.danger}`}
                    onClick={(e) => { e.stopPropagation(); onDelete?.(task._id); }}
                    title="Eliminar tarea"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
              {task.assignee && <Avatar user={task.assignee} size="sm" />}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
