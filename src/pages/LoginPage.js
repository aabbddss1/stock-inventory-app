// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState(''); // Email state
  const [password, setPassword] = useState(''); // Password state
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/customers/login', {
        email, // Send email
        password, // Send password
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
      console.error('Login failed:', error);
      alert('Invalid email or password'); // Show alert on login failure
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Please sign in to your account</p>
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
          <button onClick={handleLogin} className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
