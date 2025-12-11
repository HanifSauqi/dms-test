import { api } from './client';

export const usersApi = {
  // Get all active users (superadmin only)
  getAllUsers: () => {
    return api.get('/users');
  },

  // Get all deleted users in trash (superadmin only)
  getTrashUsers: () => {
    return api.get('/users/trash');
  },

  // Get user by ID (superadmin only)
  getUserById: (userId) => {
    return api.get(`/users/${userId}`);
  },

  // Create new user (superadmin only)
  createUser: (userData) => {
    return api.post('/users', userData);
  },

  // Update user (superadmin only)
  updateUser: (userId, userData) => {
    return api.put(`/users/${userId}`, userData);
  },

  // Soft delete user - move to trash (superadmin only)
  deleteUser: (userId) => {
    return api.delete(`/users/${userId}`);
  },

  // Restore user from trash (superadmin only)
  restoreUser: (userId) => {
    return api.post(`/users/${userId}/restore`);
  },

  // Permanently delete user from trash (superadmin only)
  permanentDeleteUser: (userId) => {
    return api.delete(`/users/${userId}/permanent`);
  },
};

export default usersApi;
