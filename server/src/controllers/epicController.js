const Epic = require('../models/Epic');
const AppError = require('../utils/AppError');

const createEpic = async (req, res, next) => {
  try {
    const epic = await Epic.create({ ...req.body, project: req.params.projectId });
    res.status(201).json({ success: true, data: epic });
  } catch (err) {
    next(err);
  }
};

const getEpics = async (req, res, next) => {
  try {
    const epics = await Epic.find({ project: req.params.projectId })
      .populate('assignee', 'name email avatar')
      .sort('-createdAt');
    res.json({ success: true, data: epics });
  } catch (err) {
    next(err);
  }
};

const getEpicById = async (req, res, next) => {
  try {
    const epic = await Epic.findById(req.params.id).populate('assignee', 'name email avatar');
    if (!epic) return next(new AppError('Epic not found', 404));
    res.json({ success: true, data: epic });
  } catch (err) {
    next(err);
  }
};

const updateEpic = async (req, res, next) => {
  try {
    const epic = await Epic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignee', 'name email avatar');
    if (!epic) return next(new AppError('Epic not found', 404));
    res.json({ success: true, data: epic });
  } catch (err) {
    next(err);
  }
};

const deleteEpic = async (req, res, next) => {
  try {
    const epic = await Epic.findByIdAndDelete(req.params.id);
    if (!epic) return next(new AppError('Epic not found', 404));
    res.json({ success: true, message: 'Epic deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createEpic, getEpics, getEpicById, updateEpic, deleteEpic };
