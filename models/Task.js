const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String, 
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'creatorModel',
  },
  creatorModel: {
    type: String,
    required: true,
    enum: ['Admin', 'Manager', 'User'],
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
