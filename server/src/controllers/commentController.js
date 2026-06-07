const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Story = require('../models/Story');
const AppError = require('../utils/AppError');
const { notifyCommentAdded } = require('../services/notificationService');

const createComment = async (req, res, next) => {
  try {
    const { content, entityType, entityId } = req.body;
    const entityModel = entityType === 'story' ? 'Story' : 'Task';

    const comment = await Comment.create({
      content,
      author: req.user._id,
      entityType,
      entityId,
      entityModel,
    });
    await comment.populate('author', 'name email avatar');

    const EntityModel = entityType === 'story' ? Story : Task;
    const entity = await EntityModel.findById(entityId);
    if (entity && entity.assignee && entity.assignee.toString() !== req.user._id.toString()) {
      await notifyCommentAdded({
        recipient: entity.assignee,
        entityTitle: entity.title,
        link: `/projects/${entity.project}/${entityType}s/${entityId}`,
        actorId: req.user._id,
      });
    }

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { entityId } = req.params;
    const comments = await Comment.find({ entityId })
      .populate('author', 'name email avatar')
      .sort('createdAt');
    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError('Comment not found', 404));
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this comment', 403));
    }
    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createComment, getComments, deleteComment };
