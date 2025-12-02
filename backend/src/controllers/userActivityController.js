const { successResponse, errorResponse } = require('../utils/response');
const {
  getUserActivityHistory,
  getAllUsersActivitySummary,
  getRecentActivities,
  getUserActivityStats
} = require('../utils/userActivityLogger');

/**
 * Get activity history for a specific user
 * Accessible by superadmin or the user themselves
 */
const getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      limit = 50,
      offset = 0,
      activityType,
      targetType,
      startDate,
      endDate
    } = req.query;

    // Check authorization: superadmin can view any user, regular users can only view their own
    if (req.user.role !== 'superadmin' && req.user.id !== parseInt(userId)) {
      return errorResponse(res, 'You are not authorized to view this user\'s activities', 403);
    }

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      activityType,
      targetType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    const result = await getUserActivityHistory(parseInt(userId), options);

    return successResponse(res, 'User activities retrieved successfully', result);
  } catch (error) {
    console.error('Error in getUserActivities:', error);
    return errorResponse(res, 'Failed to retrieve user activities', 500);
  }
};

/**
 * Get activity statistics for a specific user
 * Accessible by superadmin or the user themselves
 */
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Check authorization
    if (req.user.role !== 'superadmin' && req.user.id !== parseInt(userId)) {
      return errorResponse(res, 'You are not authorized to view this user\'s statistics', 403);
    }

    const options = {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    const stats = await getUserActivityStats(parseInt(userId), options);

    return successResponse(res, 'User statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return errorResponse(res, 'Failed to retrieve user statistics', 500);
  }
};

/**
 * Get all users with their activity summary
 * Superadmin only
 */
const getAllUsersActivities = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const result = await getAllUsersActivitySummary(options);

    return successResponse(res, 'Users activity summary retrieved successfully', result);
  } catch (error) {
    console.error('Error in getAllUsersActivities:', error);
    return errorResponse(res, 'Failed to retrieve users activities', 500);
  }
};

/**
 * Get recent activities across all users
 * Superadmin only
 */
const getRecentUserActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await getRecentActivities(parseInt(limit));

    return successResponse(res, 'Recent activities retrieved successfully', activities);
  } catch (error) {
    console.error('Error in getRecentUserActivities:', error);
    return errorResponse(res, 'Failed to retrieve recent activities', 500);
  }
};

module.exports = {
  getUserActivities,
  getUserStats,
  getAllUsersActivities,
  getRecentUserActivities
};
