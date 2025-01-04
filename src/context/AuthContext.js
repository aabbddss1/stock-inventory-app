import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5001/api/customers/login', {
        email,
        password,
      });

      const { token, role } = response.data;

      // Save user data in context and localStorage
      const userData = { email, role, token };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true, role };
    } catch (err) {
      console.error('Login failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Load user data from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, error, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
