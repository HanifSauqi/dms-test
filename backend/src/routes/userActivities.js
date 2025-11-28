const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const {
  getUserActivities,
  getUserStats,
  getAllUsersActivities,
  getRecentUserActivities
} = require('../controllers/userActivityController');

// All routes require authentication
router.use(authenticateToken);

// Get all users' activity summary (superadmin only)
router.get('/summary', requireSuperAdmin, getAllUsersActivities);

// Get recent activities across all users (superadmin only)
router.get('/recent', requireSuperAdmin, getRecentUserActivities);

// Get specific user's activities (superadmin or own user)
router.get('/user/:userId', getUserActivities);

// Get specific user's activity statistics (superadmin or own user)
router.get('/user/:userId/stats', getUserStats);

module.exports = router;
