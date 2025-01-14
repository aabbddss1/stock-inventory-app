import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/TopNavbar.css';

function TopNavbar() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');
  const [menuOpen, setMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

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

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    setLanguageMenuOpen(false);
  };

  return (
    <div className="top-navbar">
      <div className="title">
        {userRole === 'admin' ? t('Qubite Stock Management Systems') : t('userDashboard')}
      </div>

      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/help-center">{t('helpCenter')}</Link>

        {userRole === 'admin' ? (
          <Link to="/admin-users">{t('adminUsers')} ▼</Link>
        ) : (
          <Link to="/user/profile">{t('myAccount')} ▼</Link>
        )}

        <div className="language-dropdown">
          <button className="language-btn" onClick={() => setLanguageMenuOpen(!languageMenuOpen)}>
            {t('language')} ▼
          </button>
          {languageMenuOpen && (
            <div className="language-menu">
              <button onClick={() => handleLanguageChange('en')}>English</button>
              <button onClick={() => handleLanguageChange('tr')}>Türkçe</button>
            </div>
          )}
        </div>

        {timeLeft && (
          <span className="session-timer">
            {t('sessionExpires')} {timeLeft}
          </span>
        )}

        <a href="#" onClick={handleLogout}>
          {t('logout')} ▼
        </a>
      </div>
    </div>
  );
}

export default TopNavbar;
