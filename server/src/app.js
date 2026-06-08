const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorMiddleware = require('./middlewares/errorMiddleware');
const loggerMiddleware = require('./middlewares/loggerMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const epicRoutes = require('./routes/epicRoutes');
const storyRoutes = require('./routes/storyRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(loggerMiddleware);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/epics', epicRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);

app.use(errorMiddleware);

module.exports = app;
