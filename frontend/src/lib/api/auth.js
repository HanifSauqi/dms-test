import { api } from './client';

export const authApi = {
  // Login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Register
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  // Logout
  logout: () => {
    return api.post('/auth/logout');
  },

  // Get current user
  getCurrentUser: () => {
    return api.get('/auth/me');
  },

  // Update profile
  updateProfile: (data) => {
    return api.put('/auth/profile', data);
  },

  // Change password
  changePassword: (data) => {
    return api.put('/auth/password', data);
  },

  // Request password reset
  requestPasswordReset: (email) => {
    return api.post('/auth/request-reset', { email });
  },

  // Reset password
  resetPassword: (data) => {
    return api.post('/auth/reset-password', data);
  },
};

export default authApi;