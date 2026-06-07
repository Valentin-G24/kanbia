const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    acceptanceCriteria: { type: String, trim: true, default: '' },
    storyPoints: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['backlog', 'in_progress', 'review', 'done', 'cancelled'],
      default: 'backlog',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    epic: { type: mongoose.Schema.Types.ObjectId, ref: 'Epic' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sprint: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Story', storySchema);
