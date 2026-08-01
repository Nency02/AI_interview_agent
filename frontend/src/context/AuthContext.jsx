import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user details if a token exists
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Session validation failed:', err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { access_token } = res.data;
      localStorage.setItem('token', access_token);
      
      // Fetch user profile
      const userRes = await api.get('/api/auth/me');
      setUser(userRes.data);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const errorMsg = err.response?.data?.detail || 'Invalid email or password';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', { name, email, password });
      const { access_token } = res.data;
      localStorage.setItem('token', access_token);
      
      // Fetch user profile
      const userRes = await api.get('/api/auth/me');
      setUser(userRes.data);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const errorMsg = err.response?.data?.detail || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
