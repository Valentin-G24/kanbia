const Notification = require('../models/Notification');

const createNotification = async ({ recipient, type, message, link = '', actor }) => {
  if (!recipient) return;
  await Notification.create({ recipient, type, message, link, actor });
};

const notifyTaskAssigned = (task, actorId) =>
  createNotification({
    recipient: task.assignee,
    type: 'task_assigned',
    message: `You have been assigned to task: "${task.title}"`,
    link: `/projects/${task.project}/tasks/${task._id}`,
    actor: actorId,
  });

const notifyStatusChanged = ({ recipient, entityTitle, newStatus, link, actorId }) =>
  createNotification({
    recipient,
    type: 'status_changed',
    message: `Status of "${entityTitle}" changed to ${newStatus}`,
    link,
    actor: actorId,
  });

const notifyCommentAdded = ({ recipient, entityTitle, link, actorId }) =>
  createNotification({
    recipient,
    type: 'comment_added',
    message: `New comment on "${entityTitle}"`,
    link,
    actor: actorId,
  });

module.exports = { createNotification, notifyTaskAssigned, notifyStatusChanged, notifyCommentAdded };
