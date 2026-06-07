const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['admin', 'scrum_master', 'developer', 'guest'],
    default: 'developer',
  },
});

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    startDate: { type: Date },
    targetDate: { type: Date },
    status: {
      type: String,
      enum: ['planning', 'in_progress', 'paused', 'completed'],
      default: 'planning',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
    key: { type: String, uppercase: true, trim: true },
  },
  { timestamps: true }
);

projectSchema.pre('save', function (next) {
  if (!this.key) {
    this.key = this.name.substring(0, 4).toUpperCase().replace(/\s/g, '');
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
