const express = require('express');
const bcrypt = require('bcryptjs');
const Manager = require('../models/Manager');
const User = require('../models/User');
const Task = require('../models/Task');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Create user or manager based on role
router.post('/create-user', authenticate, authorize('admin'), async (req, res) => {
  const { username, email, password, role, managerId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'manager') {
      const manager = new Manager({ username, email, password: hashedPassword });
      await manager.save();
      res.status(201).json({ message: 'Manager created successfully', user: manager });
    } else if (role === 'user') {
      const user = new User({ username, email, password: hashedPassword, managerId });
      await user.save();

      // Add user to manager's assignedUsers if managerId provided
      if (managerId) {
        await Manager.findByIdAndUpdate(managerId, { $push: { assignedUsers: user._id } });
      }

      res.status(201).json({ message: 'User created successfully', user });
    } else {
      return res.status(400).json({ message: 'Invalid role. Must be "manager" or "user"' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Manager
router.post('/managers', authenticate, authorize('admin'), async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const manager = new Manager({ username, email, password: hashedPassword });
    await manager.save();
    res.status(201).json({ message: 'Manager created successfully', manager });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create User
router.post('/users', authenticate, authorize('admin'), async (req, res) => {
  const { username, email, password, managerId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, managerId });
    await user.save();

    // Add user to manager's assignedUsers
    if (managerId) {
      await Manager.findByIdAndUpdate(managerId, { $push: { assignedUsers: user._id } });
    }

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign User to Manager
router.put('/assign-manager', authenticate, authorize('admin'), async (req, res) => {
  const { userId, managerId } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, { managerId }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update manager's assignedUsers
    await Manager.findByIdAndUpdate(managerId, { $addToSet: { assignedUsers: user._id } });

    res.json({ message: 'User assigned to manager successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (both regular users and managers)
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().populate('managerId');
    const managers = await Manager.find().populate('assignedUsers');
    res.json({ users, managers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all managers
router.get('/managers', authenticate, authorize('admin'), async (req, res) => {
  try {
    const managers = await Manager.find().populate('assignedUsers');
    res.json({ managers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get users assigned to a specific manager (admin only)
router.get('/managers/:id/users', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const manager = await Manager.findById(id).populate('assignedUsers');
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    res.json({ users: manager.assignedUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my team users (manager only)
router.get('/my-team', authenticate, authorize('manager'), async (req, res) => {
  const { id } = req.user;

  try {
    const manager = await Manager.findById(id).populate('assignedUsers');
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    res.json({ users: manager.assignedUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user
router.put('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from manager's assignedUsers
    if (user.managerId) {
      await Manager.findByIdAndUpdate(user.managerId, { $pull: { assignedUsers: user._id } });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete any user or manager
router.delete('/delete-user/:id', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!id || id.trim() === '') {
    return res.status(400).json({ message: 'Invalid ID provided' });
  }

  try {
    // Try to find and delete from User collection
    let deletedEntity = await User.findByIdAndDelete(id);
    if (deletedEntity) {
      // Remove from manager's assignedUsers if the deleted entity was a user
      if (deletedEntity.managerId) {
        await Manager.findByIdAndUpdate(deletedEntity.managerId, { $pull: { assignedUsers: deletedEntity._id } });
      }
      return res.json({ message: 'User deleted successfully' });
    }

    // If not found in User, try Manager collection
    deletedEntity = await Manager.findByIdAndDelete(id);
    if (deletedEntity) {
      // Set managerId to null for all assigned users
      await User.updateMany({ managerId: id }, { $unset: { managerId: 1 } });
      return res.json({ message: 'Manager deleted successfully' });
    }

    // If not found in either collection
    return res.status(404).json({ message: 'User or Manager not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all tasks (admin only)
router.get('/all-tasks', authenticate, authorize('admin'), async (req, res) => {
  try {
    const tasks = await Task.find().populate('creatorId').populate('assignedTo');
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
