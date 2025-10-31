# Task Management System Backend Implementation TODO

- [x] Update package.json with required dependencies (jsonwebtoken, bcryptjs, dotenv)
- [x] Create .env file with MONGO_URI
- [x] Create folder structure: models/, controllers/, middleware/, routes/, config/
- [x] Create models/Admin.js schema
- [x] Create models/Manager.js schema
- [x] Create models/User.js schema
- [x] Create models/Task.js schema
- [x] Create controllers/authController.js for login and JWT
- [x] Create controllers/taskController.js for CRUD operations
- [x] Create middleware/authMiddleware.js for JWT verification
- [x] Create middleware/rbacMiddleware.js for role-based access control
- [x] Create routes/adminRoutes.js for user management
- [x] Create routes/taskRoutes.js for task operations
- [x] Create config/db.js for MongoDB connection
- [x] Update index.js to set up Express app, middleware, and routes
- [x] Create seed.js for seeding initial users
- [x] Integrate seeding into DB connection
