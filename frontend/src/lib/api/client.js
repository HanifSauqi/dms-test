import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common error cases
    if (error.response) {
      const { status, data } = error.response;

      // Token expired or invalid - only in browser environment
      if (status === 401 && typeof window !== 'undefined') {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use correct auth path
        window.location.href = '/auth/login?session=expired';
        return Promise.reject(new Error('Session expired. Please login again.'));
      }

      // Forbidden
      if (status === 403) {
        return Promise.reject(new Error('Access denied. You don\'t have permission to perform this action.'));
      }

      // Not found
      if (status === 404) {
        return Promise.reject(new Error(data?.message || 'Resource not found.'));
      }

      // Validation errors
      if (status === 400) {
        return Promise.reject(new Error(data?.message || 'Invalid request data.'));
      }

      // Server errors
      if (status >= 500) {
        return Promise.reject(new Error('Server error. Please try again later.'));
      }

      // Use server error message if available
      return Promise.reject(new Error(data?.message || 'Request failed.'));
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please check your connection.'));
    }

    // Check online status safely
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return Promise.reject(new Error('No internet connection. Please check your network.'));
    }

    // Generic error
    return Promise.reject(new Error(error.message || 'Network error. Please try again.'));
  }
);

// Helper methods for HTTP requests
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),

  // For file uploads
  upload: (url, formData, config = {}) => {
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
  },

  // For file downloads
  download: (url, config = {}) => {
    return apiClient.get(url, {
      ...config,
      responseType: 'blob',
    });
  },
};

export default apiClient;