const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getTrashUsers,
  restoreUser,
  permanentDeleteUser,
  toggleUserStatus
} = require('../controllers/userController');

// Special route for folder sharing - accessible by all authenticated users
router.get('/list-for-sharing', authenticateToken, getAllUsers);

// All other routes require authentication and superadmin role
router.use(authenticateToken);
router.use(requireSuperAdmin);

// User management routes (superadmin only)
router.post('/', createUser);                      // Create new user
router.get('/', getAllUsers);                      // Get all active users
router.get('/trash', getTrashUsers);               // Get all deleted users in trash
router.get('/:id', getUserById);                   // Get user by ID
router.put('/:id', updateUser);                    // Update user
router.delete('/:id', deleteUser);                 // Soft delete user (move to trash)
router.post('/:id/restore', restoreUser);          // Restore user from trash
router.delete('/:id/permanent', permanentDeleteUser); // Permanently delete user from trash
router.patch('/:id/status', toggleUserStatus);     // Toggle user status (enable/disable)

module.exports = router;
