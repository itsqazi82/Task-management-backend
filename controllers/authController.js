const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const User = require('../models/User');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user;
    let model;
    let role;

    // Check Admin collection first
    user = await Admin.findOne({ email });
    if (user) {
      model = 'Admin';
      role = 'admin';
    } else {
      // Check Manager collection
      user = await Manager.findOne({ email });
      if (user) {
        model = 'Manager';
        role = 'manager';
      } else {
        // Check User collection
        user = await User.findOne({ email });
        if (user) {
          model = 'User';
          role = 'user';
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role, model },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { login };
