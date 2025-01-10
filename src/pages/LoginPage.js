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
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Please sign in to your account</p>
        {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Display error */}
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Email" // Placeholder updated
            value={email} // Bind email state
            onChange={(e) => setEmail(e.target.value)} // Update email state on change
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password" // Placeholder for password
            value={password} // Bind password state
            onChange={(e) => setPassword(e.target.value)} // Update password state on change
            className="login-input"
          />
          <button
            onClick={handleLogin}
            className="login-button"
            disabled={isLoading} // Disable button when loading
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;