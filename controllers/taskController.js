const Task = require('../models/Task');
const User = require('../models/User');
const Manager = require('../models/Manager');

const createTask = async (req, res) => {
  const { title, description, dueDate, assignedTo, priority, status } = req.body;
  const { id: creatorId, model: creatorModel } = req.user;

  try {
    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      status,
      creatorId,
      creatorModel,
      assignedTo,
    });

    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTasks = async (req, res) => {
  const { id, role, model } = req.user;

  try {
    let tasks;
    if (role === 'admin') {
      tasks = await Task.find().populate('creatorId').populate('assignedTo');
    } else if (role === 'manager') {
      const manager = await Manager.findById(id).populate('assignedUsers');
      const userIds = manager.assignedUsers.map(user => user._id);
      tasks = await Task.find({
        $or: [
          { creatorId: id, creatorModel: model },
          { assignedTo: { $in: userIds } },
        ],
      }).populate('creatorId').populate('assignedTo');
    } else {
      tasks = await Task.find({
        $or: [
          { creatorId: id, creatorModel: model },
          { assignedTo: id },
        ],
      }).populate('creatorId').populate('assignedTo');
    }

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { id: userId, role, model } = req.user;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (role === 'admin') {
      // Admin can update any task
    } else if (role === 'manager') {
      const manager = await Manager.findById(userId).populate('assignedUsers');
      const userIds = manager.assignedUsers.map(user => user._id);
      if (
        task.creatorId.toString() !== userId ||
        !userIds.includes(task.assignedTo)
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      if (
        task.creatorId.toString() !== userId ||
        task.assignedTo?.toString() !== userId
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    Object.assign(task, updates);
    await task.save();
    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  const { id: userId, role, model } = req.user;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions (similar to update)
    if (role === 'admin') {
      // Admin can delete any task
    } else if (role === 'manager') {
      const manager = await Manager.findById(userId).populate('assignedUsers');
      const userIds = manager.assignedUsers.map(user => user._id);
      if (
        task.creatorId.toString() !== userId ||
        !userIds.includes(task.assignedTo)
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      if (
        task.creatorId.toString() !== userId ||
        task.assignedTo?.toString() !== userId
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await Task.findByIdAndDelete(id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDashboard = async (req, res) => {
  const { id, role, model } = req.user;

  try {
    let query = {};
    if (role === 'admin') {
      // Admin can see all tasks
    } else if (role === 'manager') {
      const manager = await Manager.findById(id).populate('assignedUsers');
      const assignedUserIds = manager.assignedUsers.map(user => user._id);
      query.$or = [
        { creatorId: id, creatorModel: model },
        { assignedTo: { $in: assignedUserIds } }
      ];
    } else if (role === 'user') {
      query.$or = [
        { creatorId: id, creatorModel: model },
        { assignedTo: id }
      ];
    }

    const tasks = await Task.find(query);

    const totalTasks = tasks.length;
    const inProgress = tasks.filter(task => task.status === 'in-progress').length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = tasks.filter(task => task.status === 'pending').length;

    res.json({
      'Total Tasks': totalTasks,
      'In Progress': inProgress,
      'Completed': completed,
      'Pending': pending
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyTasks = async (req, res) => {
  const { id, role, model } = req.user;

  try {
    let query = {};
    if (role === 'admin') {
      // Admin can see all tasks
    } else if (role === 'manager') {
      const manager = await Manager.findById(id).populate('assignedUsers');
      const assignedUserIds = manager.assignedUsers.map(user => user._id);
      query.$or = [
        { creatorId: id, creatorModel: model },
        { assignedTo: { $in: assignedUserIds } }
      ];
    } else if (role === 'user') {
      query.$or = [
        { creatorId: id, creatorModel: model },
        { assignedTo: id }
      ];
    }

    const tasks = await Task.find(query).populate('creatorId').populate('assignedTo');
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const rateTask = async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const { id: userId, role } = req.user;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only allow rating if user is assigned to the task or is admin/manager
    if (role === 'admin') {
      // Admin can rate any task
    } else if (role === 'manager') {
      const manager = await Manager.findById(userId).populate('assignedUsers');
      const assignedUserIds = manager.assignedUsers.map(user => user._id);
      if (
        task.creatorId.toString() !== userId &&
        !assignedUserIds.includes(task.assignedTo)
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      if (task.assignedTo?.toString() !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    task.rating = rating;
    await task.save();
    res.json({ message: 'Task rated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createMyTask = async (req, res) => {
  const { title, description, dueDate, priority, status } = req.body;
  const { id: creatorId, model: creatorModel } = req.user;

  try {
    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      status,
      creatorId,
      creatorModel,
      assignedTo: creatorId, // Assign to myself
    });

    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateMyTask = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { id: userId } = req.user;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only allow updating own tasks
    if (task.creatorId.toString() !== userId && task.assignedTo?.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(task, updates);
    await task.save();
    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteMyTask = async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only allow deleting own tasks
    if (task.creatorId.toString() !== userId && task.assignedTo?.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserTasks = async (req, res) => {
  const { userId } = req.params;

  // Only admin can access this
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const tasks = await Task.find({ assignedTo: userId }).populate('creatorId').populate('assignedTo');
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllTasks = async (req, res) => {
  // Only admin can access this
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const tasks = await Task.find().populate('creatorId').populate('assignedTo');
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create task for team (manager only)
const createTeamTask = async (req, res) => {
  const { title, description, dueDate, assignedTo, priority, status } = req.body;
  const { id: creatorId, model: creatorModel } = req.user;

  // Only manager can create team tasks
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied. Only managers can create team tasks.' });
  }

  try {
    // Verify that the assigned user is in the manager's team
    const manager = await Manager.findById(creatorId).populate('assignedUsers');
    const isAssignedUser = manager.assignedUsers.some(user => user._id.toString() === assignedTo);

    if (!isAssignedUser) {
      return res.status(403).json({ message: 'Can only assign tasks to users in your team.' });
    }

    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      status,
      creatorId,
      creatorModel,
      assignedTo,
    });

    await task.save();
    res.status(201).json({ message: 'Team task created successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyTeamTasks = async (req, res) => {
  const { id, role } = req.user;

  // Only manager can access this
  if (role !== 'manager') {
    return res.status(403).json({ message: 'Access denied. Only managers can view team tasks.' });
  }

  try {
    const manager = await Manager.findById(id).populate('assignedUsers');
    const assignedUserIds = manager.assignedUsers.map(user => user._id);

    const tasks = await Task.find({
      $or: [
        { creatorId: id, creatorModel: req.user.model },
        { assignedTo: { $in: assignedUserIds } }
      ]
    }).populate('creatorId').populate('assignedTo');

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask, getDashboard, getMyTasks, rateTask, createMyTask, updateMyTask, deleteMyTask, getUserTasks, getAllTasks, createTeamTask, getMyTeamTasks };
