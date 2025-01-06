import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/TopNavbar.css';

function TopNavbar() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role'); // Check user role (admin or user)
  const [menuOpen, setMenuOpen] = useState(false); // State for mobile menu

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token from local storage
    localStorage.removeItem('role'); // Remove the role from local storage
    navigate('/'); // Redirect to the login page
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Toggle the mobile menu
  };

  return (
    <div className="top-navbar">
      {/* Conditional Title */}
      <div className="title">
        {userRole === 'admin'
          ? 'Qubite Stock Inventory Admin Page'
          : 'Qubite User Dashboard'}
      </div>

      {/* Hamburger Icon for Mobile */}
      <div className="hamburger" onClick={toggleMenu}>
        ☰
      </div>

      {/* Navigation Links */}
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {/* Help Center */}
        <Link to="/help-center">Help Center</Link>

        {/* Conditional Links for Admin */}
        {userRole === 'admin' ? (
          <Link to="/admin-users">Admin Users ▼</Link>
        ) : (
          <Link to="/user/profile">My Account ▼</Link>
        )}

        {/* Language Selector */}
        <Link to="/language">Language ▼</Link>

        {/* Logout */}
        <a href="#" onClick={handleLogout}>
          Logout ▼
        </a>
      </div>
    </div>
  );
}

export default TopNavbar;
