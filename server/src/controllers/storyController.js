const Story = require('../models/Story');
const AppError = require('../utils/AppError');

const createStory = async (req, res, next) => {
  try {
    const story = await Story.create({ ...req.body });
    await story.populate('assignee', 'name email avatar');
    res.status(201).json({ success: true, data: story });
  } catch (err) {
    next(err);
  }
};

const getStories = async (req, res, next) => {
  try {
    const { projectId, epicId } = req.query;
    const filter = {};
    if (projectId) filter.project = projectId;
    if (epicId) filter.epic = epicId;

    const stories = await Story.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('epic', 'title')
      .sort('-createdAt');
    res.json({ success: true, data: stories });
  } catch (err) {
    next(err);
  }
};

const getStoryById = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('epic', 'title');
    if (!story) return next(new AppError('Story not found', 404));
    res.json({ success: true, data: story });
  } catch (err) {
    next(err);
  }
};

const updateStory = async (req, res, next) => {
  try {
    const story = await Story.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignee', 'name email avatar')
      .populate('epic', 'title');
    if (!story) return next(new AppError('Story not found', 404));
    res.json({ success: true, data: story });
  } catch (err) {
    next(err);
  }
};

const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    if (!story) return next(new AppError('Story not found', 404));
    res.json({ success: true, message: 'Story deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createStory, getStories, getStoryById, updateStory, deleteStory };
