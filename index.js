require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { login } = require('./controllers/authController');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// DB Connect
connectDB();

// Allowed Origins
const allowedOrigins = [
  "https://task-management-frontend-three-gamma.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: allowedOrigins,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
}));

// ✅ Must allow OPTIONS manually to prevent 502 on Railway
// app.options("*", (req, res) => {
//   res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.sendStatus(200);
// });

// Body parser
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("✅ Backend Running OK");
});

app.post('/api/auth/login', login);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`)
);
