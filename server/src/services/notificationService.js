const Notification = require('../models/Notification');

const createNotification = async ({ recipient, type, message, link = '', actor }) => {
  if (!recipient) return;
  await Notification.create({ recipient, type, message, link, actor });
};

const STATUS_LABELS = {
  todo: 'Pendiente',
  in_progress: 'En progreso',
  review: 'En revisión',
  done: 'Completado',
};

const notifyTaskAssigned = (task, actorId) =>
  createNotification({
    recipient: task.assignee,
    type: 'task_assigned',
    message: `Se te asignó la tarea: "${task.title}"`,
    link: `/projects/${task.project}/tasks/${task._id}`,
    actor: actorId,
  });

const notifyStatusChanged = ({ recipient, entityTitle, newStatus, link, actorId }) =>
  createNotification({
    recipient,
    type: 'status_changed',
    message: `El estado de "${entityTitle}" cambió a ${STATUS_LABELS[newStatus] || newStatus}`,
    link,
    actor: actorId,
  });

const notifyCommentAdded = ({ recipient, entityTitle, link, actorId }) =>
  createNotification({
    recipient,
    type: 'comment_added',
    message: `Nuevo comentario en "${entityTitle}"`,
    link,
    actor: actorId,
  });

module.exports = { createNotification, notifyTaskAssigned, notifyStatusChanged, notifyCommentAdded };
