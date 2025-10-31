require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const Manager = require('./models/Manager');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    // Check if users already exist
    const adminCount = await Admin.countDocuments();
    const managerCount = await Manager.countDocuments();
    const userCount = await User.countDocuments();

    if (adminCount > 0 || managerCount > 0 || userCount > 0) {
      console.log('Users already seeded. Skipping...');
      return;
    }

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    // Create Admin
    const admin = new Admin({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
    });
    await admin.save();
    console.log('Admin user created');

    // Create Manager
    const manager = new Manager({
      username: 'manager',
      email: 'manager@example.com',
      password: managerPassword,
    });
    await manager.save();
    console.log('Manager user created');

    // Create User assigned to Manager
    const user = new User({
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      managerId: manager._id,
    });
    await user.save();

    // Add user to manager's assignedUsers
    manager.assignedUsers.push(user._id);
    await manager.save();

    console.log('User created and assigned to manager');
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedUsers;
