const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const { notifyTaskAssigned, notifyStatusChanged } = require('../services/notificationService');

const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    if (task.assignee) {
      await notifyTaskAssigned(task, req.user._id);
    }

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { projectId, storyId, status } = req.query;
    const filter = {};
    if (projectId) filter.project = projectId;
    if (storyId) filter.story = storyId;
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('story', 'title')
      .sort('order');
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('story', 'title')
      .populate('epic', 'title');
    if (!task) return next(new AppError('Task not found', 404));
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const previousTask = await Task.findById(req.params.id);
    if (!previousTask) return next(new AppError('Task not found', 404));

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (req.body.status && req.body.status !== previousTask.status && task.assignee) {
      await notifyStatusChanged({
        recipient: task.assignee._id,
        entityTitle: task.title,
        newStatus: task.status,
        link: `/projects/${task.project}/tasks/${task._id}`,
        actorId: req.user._id,
      });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return next(new AppError('Task not found', 404));
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('assignee', 'name email avatar');
    if (!task) return next(new AppError('Task not found', 404));
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, updateTaskStatus };
