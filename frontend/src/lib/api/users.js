import { api } from './client';

export const usersApi = {
  // Get all users (superadmin only)
  getAllUsers: () => {
    return api.get('/users');
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

  // Delete user (superadmin only)
  deleteUser: (userId) => {
    return api.delete(`/users/${userId}`);
  },
};

export default usersApi;
