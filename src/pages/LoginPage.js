// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faLock, 
  faEye, 
  faEyeSlash 
} from '@fortawesome/free-solid-svg-icons';
import '../styles/LoginPage.css';

function LoginPage() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage(t('errorRequired'));
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post('http://37.148.210.169:5001/api/customers/login', {
        email,
        password,
      });

      const { token, role } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      setErrorMessage(t('invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tr' : i18n.language === 'tr' ? 'de' : i18n.language === 'de' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-left">
      <div className="qubite-icon">
  <a href="https://qubitestock.online">
    <img src="/qubite.png" alt="Logo" className="qubite-icon" />
  </a>
</div>
        <h1>
          {t('welcome')}{' '}
          <span className="break-word">
            {t('systemName')}
          </span>
        </h1>
        <p>{t('description')}</p>
        <div className="gradient-shapes"></div>
      </div>
      
      <div className="login-right">
        <div className="login-form">
          <div className="language-toggle">
            <button onClick={toggleLanguage} className="lang-button">
            {i18n.language === 'en' ? 'EN' : i18n.language === 'tr' ? 'TR' : i18n.language === 'de' ? 'DE' : 'ES'}
            </button>
          </div>
          <div className="golfplast-icon">
            <img src="/GolfPlast_logo.png" alt="Golfplast Logo" className="golfplast-icon-image" />
          </div>
          <h2>{t('userLogin')}</h2>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          
          <div className="input-group">
            <span className="input-icon">
              <FontAwesomeIcon icon={faUser} />
            </span>
            <input
              type="text"
              placeholder={t('E-mail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <span className="input-icon">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              aria-label="Toggle password visibility"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
          
          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t('remember')}</span>
            </label>
            <a href="/forgot-password" className="forgot-password">
              {t('forgotPassword')}
            </a>
          </div>
          
          <button
            onClick={handleLogin}
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? t('loggingIn') : t('login')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;