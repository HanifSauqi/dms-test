const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// Special route for folder sharing - accessible by all authenticated users
router.get('/list-for-sharing', authenticateToken, getAllUsers);

// All other routes require authentication and superadmin role
router.use(authenticateToken);
router.use(requireSuperAdmin);

// User management routes (superadmin only)
router.post('/', createUser);           // Create new user
router.get('/', getAllUsers);           // Get all users
router.get('/:id', getUserById);        // Get user by ID
router.put('/:id', updateUser);         // Update user
router.delete('/:id', deleteUser);      // Delete user

module.exports = router;
