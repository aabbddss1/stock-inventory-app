// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Using useNavigate to programmatically navigate to the admin page

  const handleLogin = () => {
    // Handle login logic here
    console.log('Logging in with:', username, password);

    // Redirect to the admin page
    navigate('/admin'); // Update this path to match your admin page route
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Please sign in to your account</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
