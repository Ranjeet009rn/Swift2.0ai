import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/apiService';
import { removeAuthToken, setStoredUser } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount by validating token with backend
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.data.user) {
            setUser(response.data.user);
            // Optionally update stored user for backup/offline, but source of truth is now DB
            setStoredUser(response.data.user);
          } else {
            // Token invalid or expired
            logout();
          }
        } catch (error) {
          console.error("Session validation failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, role = 'user') => {
    try {
      const response = await apiService.login(email, password);

      if (response.success) {
        // Merge role into user data if not present (backend usually sends it now)
        const userData = { ...response.data.user };

        // Ensure role consistency if needed
        if (!userData.role) userData.role = role;

        // CRITICAL FIX: Explicitly set auth token here as well to ensure it persists
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }

        setUser(userData);
        setStoredUser(userData); // Ensure persistence
        return { success: true, data: { ...response.data, user: userData } };
      }

      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await apiService.register(userData);

      if (response.success) {
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const updateUserProfile = async (profileData) => {
    // Check if using mock credentials
    if (user && user.token === 'mock-jwt-token-bypass-backend') {
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      setStoredUser(updatedUser);
      console.log('[Auth] Mock Profile Update Success:', updatedUser);

      // Simulate detailed profile data update (in a real app this would update a separate profile object, 
      // but here we just update the auth user object for simplicity or assume success)
      return { success: true, message: 'Profile updated successfully (Mock)' };
    }

    try {
      const response = await apiService.updateProfile(profileData);

      if (response.success) {
        // Update local user state merging existing user data with updates
        const updatedUser = { ...user, ...profileData };
        setUser(updatedUser);
        // Persist to storage
        setStoredUser(updatedUser);
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message || 'Update failed' };
    }
  };



  const logout = () => {
    apiService.logout();
    removeAuthToken();
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateUserProfile,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
