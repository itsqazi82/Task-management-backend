require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { login } = require('./controllers/authController');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Connect to DB
connectDB();

// ✅ Allow ALL origins — NO CORS errors
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization"
}));

// ✅ Handle preflight requests to avoid errors
app.options("/*", (req, res) => {
  res.sendStatus(200);
});

app.use(express.json());

// ✅ Routes
app.post('/api/auth/login', login);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} and host 0.0.0.0`);
});
