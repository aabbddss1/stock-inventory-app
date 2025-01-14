// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import '../styles/LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState(''); // Email state
  const [password, setPassword] = useState(''); // Password state
  const [isLoading, setIsLoading] = useState(false); // Loading state for login button
  const [errorMessage, setErrorMessage] = useState(''); // Error message state
  const navigate = useNavigate();

  // Handle login process
  const handleLogin = async () => {
    // Validation before sending request
    if (!email || !password) {
      setErrorMessage('Email and password are required');
      return;
    }

    setIsLoading(true); // Set loading state
    setErrorMessage(''); // Clear any previous errors

    try {
      const response = await api.post('/api/customers/login', {
        email,
        password,
      });

      const { token, role } = response.data; // Extract token and role from response
      localStorage.setItem('token', token); // Store token in local storage
      localStorage.setItem('role', role); // Store role in local storage

      if (role === 'admin') {
        navigate('/admin'); // Redirect admin to admin panel
      } else {
        navigate('/user'); // Redirect user to user panel
      }
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'Invalid email or password';
      setErrorMessage(errorMessage); // Show error message
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="brand-section">
          <h1>Qubite</h1>
          <p className="brand-tagline">Stock Management System</p>
        </div>
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Please sign in to your account</p>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
            </div>
            <button
              onClick={handleLogin}
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
          <p className="system-version">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;