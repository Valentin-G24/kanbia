const Project = require('../models/Project');
const Epic = require('../models/Epic');
const Story = require('../models/Story');
const Task = require('../models/Task');

const getDashboardStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userFilter = isAdmin ? {} : {
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    };

    const projects = await Project.find(userFilter).select('_id status');
    const projectIds = projects.map((p) => p._id);

    const [epicsCount, storiesCount, tasks] = await Promise.all([
      Epic.countDocuments({ project: { $in: projectIds } }),
      Story.countDocuments({ project: { $in: projectIds } }),
      Task.find({ project: { $in: projectIds } }).select('status'),
    ]);

    const tasksByStatus = tasks.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      { todo: 0, in_progress: 0, review: 0, done: 0 }
    );

    const projectsByStatus = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      { planning: 0, in_progress: 0, paused: 0, completed: 0 }
    );

    res.json({
      success: true,
      data: {
        projects: { total: projects.length, byStatus: projectsByStatus },
        epics: epicsCount,
        stories: storiesCount,
        tasks: {
          total: tasks.length,
          done: tasksByStatus.done,
          pending: tasks.length - tasksByStatus.done,
          byStatus: tasksByStatus,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats };
