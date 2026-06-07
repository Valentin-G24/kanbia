const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    entityType: { type: String, enum: ['story', 'task'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'entityModel' },
    entityModel: { type: String, enum: ['Story', 'Task'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
