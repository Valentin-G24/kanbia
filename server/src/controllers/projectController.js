const Project = require('../models/Project');
const AppError = require('../utils/AppError');

const createProject = async (req, res, next) => {
  try {
    const project = await Project.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const query =
      req.user.role === 'admin'
        ? {}
        : {
            $or: [
              { owner: req.user._id },
              { 'members.user': req.user._id },
            ],
          };
    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-createdAt');
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    if (!project) return next(new AppError('Project not found', 404));
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email avatar');
    if (!project) return next(new AppError('Project not found', 404));
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return next(new AppError('Project not found', 404));
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return next(new AppError('Project not found', 404));

    const alreadyMember = project.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) return next(new AppError('User is already a member', 409));

    project.members.push({ user: userId, role: role || 'developer' });
    await project.save();
    await project.populate('members.user', 'name email avatar');
    await project.populate('owner', 'name email avatar');
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) return next(new AppError('Project not found', 404));

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();
    await project.populate('members.user', 'name email avatar');
    await project.populate('owner', 'name email avatar');
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember, removeMember };
