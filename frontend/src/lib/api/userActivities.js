import apiClient from './client';

export const userActivitiesApi = {
  /**
   * Get activities for a specific user
   * @param {number} userId - User ID
   * @param {object} params - Query parameters (limit, offset, activityType, targetType, startDate, endDate)
   * @returns {Promise} - Activities data with pagination
   */
  getUserActivities: async (userId, params = {}) => {
    const response = await apiClient.get(`/user-activities/user/${userId}`, { params });
    return response;
  },

  /**
   * Get activity statistics for a specific user
   * @param {number} userId - User ID
   * @param {object} params - Query parameters (startDate, endDate)
   * @returns {Promise} - User activity statistics
   */
  getUserStats: async (userId, params = {}) => {
    const response = await apiClient.get(`/user-activities/user/${userId}/stats`, { params });
    return response.data;
  },

  /**
   * Get all users with their activity summary (superadmin only)
   * @param {object} params - Query parameters (limit, offset)
   * @returns {Promise} - Users with activity summary
   */
  getAllUsersActivities: async (params = {}) => {
    const response = await apiClient.get('/user-activities/summary', { params });
    return response.data;
  },

  /**
   * Get recent activities across all users (superadmin only)
   * @param {number} limit - Maximum number of activities to return
   * @returns {Promise} - Recent activities
   */
  getRecentActivities: async (limit = 20) => {
    const response = await apiClient.get('/user-activities/recent', { params: { limit } });
    return response.data;
  }
};

export default userActivitiesApi;
