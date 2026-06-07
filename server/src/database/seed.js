require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('./connection');
const User = require('../models/User');
const Project = require('../models/Project');
const Epic = require('../models/Epic');
const Story = require('../models/Story');
const Task = require('../models/Task');

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Epic.deleteMany({}),
    Story.deleteMany({}),
    Task.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@agileflow.dev',
    password: 'admin123',
    role: 'admin',
  });

  const sm = await User.create({
    name: 'Scrum Master',
    email: 'sm@agileflow.dev',
    password: 'scrum123',
    role: 'scrum_master',
  });

  const dev = await User.create({
    name: 'Developer',
    email: 'dev@agileflow.dev',
    password: 'dev12345',
    role: 'developer',
  });

  const project = await Project.create({
    name: 'AgileFlow Platform',
    description: 'Internal project management platform',
    status: 'in_progress',
    owner: admin._id,
    members: [
      { user: sm._id, role: 'scrum_master' },
      { user: dev._id, role: 'developer' },
    ],
  });

  const epic = await Epic.create({
    title: 'Authentication System',
    description: 'Complete auth flow with JWT',
    priority: 'high',
    status: 'in_progress',
    project: project._id,
    assignee: sm._id,
  });

  const story = await Story.create({
    title: 'User Registration',
    description: 'As a user, I want to register with email and password',
    acceptanceCriteria: 'Given valid data, when I submit, then account is created',
    storyPoints: 5,
    status: 'in_progress',
    priority: 'high',
    project: project._id,
    epic: epic._id,
    assignee: dev._id,
  });

  await Task.create([
    {
      title: 'Design registration form',
      description: 'Create UI for registration',
      status: 'done',
      priority: 'high',
      project: project._id,
      story: story._id,
      assignee: dev._id,
      createdBy: sm._id,
    },
    {
      title: 'Implement POST /auth/register',
      description: 'Backend endpoint for registration',
      status: 'in_progress',
      priority: 'high',
      project: project._id,
      story: story._id,
      assignee: dev._id,
      createdBy: sm._id,
    },
    {
      title: 'Write unit tests',
      description: 'Cover registration edge cases',
      status: 'todo',
      priority: 'medium',
      project: project._id,
      story: story._id,
      assignee: dev._id,
      createdBy: sm._id,
    },
  ]);

  console.log('\n[Seed] Database populated successfully!');
  console.log('  admin@agileflow.dev    / admin123');
  console.log('  sm@agileflow.dev       / scrum123');
  console.log('  dev@agileflow.dev      / dev12345');
  process.exit(0);
};

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
