'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Create dedicated axios instance for auth operations
const createApiInstance = () => {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  });
};

// Auto logout after 30 minutes of inactivity
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);
  const apiRef = useRef(createApiInstance());

  // Get current API instance
  const getApi = useCallback(() => apiRef.current, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      // Auto logout after inactivity
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      // Recreate API instance to clear headers
      apiRef.current = createApiInstance();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login?timeout=true';
      }
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Track user activity
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

      events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
      });

      // Initialize timer
      resetInactivityTimer();

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, resetInactivityTimer);
        });
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [user, resetInactivityTimer]);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        // Set token in API instance headers
        const api = getApi();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
          // Verify token is still valid
          const response = await api.get('/auth/verify');
          if (response.data.success) {
            const userData = response.data.data.user;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (error) {
          // Token invalid, remove it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Recreate API instance to clear headers
          apiRef.current = createApiInstance();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [getApi]);

  const login = async (email, password) => {
    try {
      const api = getApi();
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { user, token } = response.data.data;

        // Store in localStorage only (single source of truth)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Set authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setUser(user);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = useCallback(async () => {
    try {
      const api = getApi();
      // Call backend logout endpoint to log the activity
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Recreate API instance to ensure clean state
      apiRef.current = createApiInstance();
      setUser(null);
    }
  }, [getApi]);

  const value = {
    user,
    login,
    logout,
    loading,
    api: getApi() // Export api instance getter
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};