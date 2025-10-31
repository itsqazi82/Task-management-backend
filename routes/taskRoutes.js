const express = require('express');
const { createTask, getTasks, updateTask, deleteTask, getDashboard, getMyTasks, rateTask, createMyTask, updateMyTask, deleteMyTask, getUserTasks, getAllTasks, createTeamTask, getMyTeamTasks } = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// Dashboard - get task statistics
router.get('/dashboard', getDashboard);

// Get my tasks
router.get('/my-tasks', getMyTasks);

// Get my team tasks (manager only)
router.get('/my-team-tasks', getMyTeamTasks);

// Create my task (assign to myself)
router.post('/my-task', createMyTask);

// Create team task (manager only)
router.post('/team-task', createTeamTask);

// Create task
router.post('/', createTask);

// Get tasks
router.get('/', getTasks);

// Get tasks assigned to a specific user (admin only)
router.get('/user/:userId', getUserTasks);

// Get all tasks (admin only)
router.get('/all', getAllTasks);

// Rate task
router.post('/:id/rate', rateTask);

// Update my task
router.put('/my-task/:id', updateMyTask);

// Update task
router.put('/:id', updateTask);

// Delete my task
router.delete('/my-task/:id', deleteMyTask);

// Delete task
router.delete('/:id', deleteTask);

module.exports = router;
