const express = require('express');
const { register, login, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
// Register route disabled - users are now created by superadmin via /api/users
// router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);

// Protected routes
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
});

// Test protected route
router.get('/test', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route accessed successfully',
    user: req.user
  });
});

module.exports = router;