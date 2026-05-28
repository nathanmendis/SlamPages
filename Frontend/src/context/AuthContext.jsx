import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session already exists in localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { tokens, access, refresh, user: userData } = response.data;
      
      const accessToken = tokens ? tokens.access : access;
      const refreshToken = tokens ? tokens.refresh : refresh;
      
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Invalid credentials'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const { tokens, access, refresh, user: userData } = response.data;

      const accessToken = tokens ? tokens.access : access;
      const refreshToken = tokens ? tokens.refresh : refresh;

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      const errors = error.response?.data;
      let errorMsg = 'Registration failed';
      if (errors) {
        if (typeof errors === 'object') {
          errorMsg = Object.values(errors).flat().join(' ');
        } else {
          errorMsg = errors;
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const googleLogin = async (token) => {
    try {
      const response = await api.post('/auth/google', { token });
      const { tokens, access, refresh, user: userData } = response.data;

      const accessToken = tokens ? tokens.access : access;
      const refreshToken = tokens ? tokens.refresh : refresh;

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Google login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
