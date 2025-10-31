const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'user',
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
