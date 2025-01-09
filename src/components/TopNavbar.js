import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/TopNavbar.css';

function TopNavbar() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');
  const [menuOpen, setMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Decode the JWT token to get expiration time
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeRemaining = expirationTime - currentTime;

        if (timeRemaining <= 0) {
          handleLogout();
          return;
        }

        // Format the remaining time
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    };

    // Check every second
    const timer = setInterval(checkTokenExpiration, 1000);

    // Initial check
    checkTokenExpiration();

    // Cleanup
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleLanguageMenu = () => {
    setLanguageMenuOpen(!languageMenuOpen);
  };

  const handleLanguageChange = (language) => {
    // Here you can add logic to change the language
    // For example, storing the selected language in localStorage
    localStorage.setItem('language', language);
    setLanguageMenuOpen(false);
  };

  return (
    <div className="top-navbar">
      <div className="title">
        {userRole === 'admin'
          ? 'Qubite Stock Management Systems'
          : 'Qubite User Dashboard'}
      </div>

      <div className="hamburger" onClick={toggleMenu}>
        ☰
      </div>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/help-center">Help Center</Link>

        {userRole === 'admin' ? (
          <Link to="/admin-users">Admin Users ▼</Link>
        ) : (
          <Link to="/user/profile">My Account ▼</Link>
        )}

        <div className="language-dropdown">
          <button className="language-btn" onClick={toggleLanguageMenu}>
            Language ▼
          </button>
          {languageMenuOpen && (
            <div className="language-menu">
              <button onClick={() => handleLanguageChange('en')}>English</button>
              <button onClick={() => handleLanguageChange('tr')}>Türkçe</button>
            </div>
          )}
        </div>

        {/* Add session timer */}
        {timeLeft && (
          <span className="session-timer">
            Session expires in: {timeLeft}
          </span>
        )}

        <a href="#" onClick={handleLogout}>
          Logout ▼
        </a>
      </div>
    </div>
  );
}

export default TopNavbar;
