import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('fluxnex_token'));

  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AuthContext] checkAuth - token exists:', !!token);
      
      if (!token) {
        console.log('[AuthContext] No token found, setting loading=false');
        setLoading(false);
        return;
      }

      try {
        console.log('[AuthContext] Validating token with /api/auth/me');
        const response = await axios.get(`${backendUrl}/api/auth/me`);
        console.log('[AuthContext] Token valid, user:', response.data.email);
        setUser(response.data);
      } catch (error) {
        console.error('[AuthContext] Auth check failed:', error.response?.status, error.message);
        // Token is invalid, remove it
        localStorage.removeItem('fluxnex_token');
        setToken(null);
        setUser(null);
      } finally {
        console.log('[AuthContext] Setting loading=false');
        setLoading(false);
      }
    };

    checkAuth();
  }, [token, backendUrl]);

  const register = async (email, password, fullName) => {
    try {
      console.log('[AuthContext] Registration attempt for:', email);
      
      // Step 1: Register user
      const response = await axios.post(`${backendUrl}/api/auth/register`, {
        email,
        password,
        full_name: fullName
      });
      console.log('[AuthContext] Registration successful');
      
      // Step 2: Auto-login - get token
      const loginResponse = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password
      });
      
      const newToken = loginResponse.data.access_token;
      console.log('[AuthContext] Token received, storing...');
      
      // Step 3: Store token
      localStorage.setItem('fluxnex_token', newToken);
      
      // Step 4: Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Step 5: Fetch user profile BEFORE updating state
      console.log('[AuthContext] Fetching user profile...');
      const userResponse = await axios.get(`${backendUrl}/api/auth/me`);
      console.log('[AuthContext] User profile received:', userResponse.data.email);
      
      // Step 6: Update ALL state synchronously
      setToken(newToken);
      setUser(userResponse.data);
      setLoading(false);
      
      console.log('[AuthContext] Registration complete - state updated, ready to navigate');
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Registration failed:', error.response?.data?.detail || error.message);
      const message = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const login = async (email, password) => {
    try {
      console.log('[AuthContext] Login attempt for:', email);
      
      // Step 1: Get token from login endpoint
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password
      });
      
      const newToken = response.data.access_token;
      console.log('[AuthContext] Token received, storing...');
      
      // Step 2: Store token in localStorage
      localStorage.setItem('fluxnex_token', newToken);
      
      // Step 3: Set token in axios headers immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Step 4: Fetch user profile BEFORE updating state
      console.log('[AuthContext] Fetching user profile...');
      const userResponse = await axios.get(`${backendUrl}/api/auth/me`);
      console.log('[AuthContext] User profile received:', userResponse.data.email);
      
      // Step 5: Update ALL state synchronously
      setToken(newToken);
      setUser(userResponse.data);
      setLoading(false);
      
      console.log('[AuthContext] Login complete - state updated, ready to navigate');
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Login failed:', error.response?.data?.detail || error.message);
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('fluxnex_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
