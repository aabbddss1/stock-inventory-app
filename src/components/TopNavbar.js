import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/TopNavbar.css';

function TopNavbar() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role'); // Check user role (admin or user)

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token from local storage
    localStorage.removeItem('role'); // Remove the role from local storage
    navigate('/'); // Redirect to the login page
  };

  return (
    <div className="top-navbar">
      {/* Conditional Title */}
      <div className="title">
        {userRole === 'admin'
          ? 'Qubite Stock Inventory Admin Page'
          : 'Qubite User Dashboard'}
      </div>

      <div className="nav-links">
        {/* Help Center */}
        <Link to="/help-center">Help Center</Link>

        {/* Conditional Links for Admin */}
        {userRole === 'admin' ? (
          <>
            <Link to="/admin-users">Admin Users ▼</Link>
            <Link to="/admin-panel">Admin Panel ▼</Link>
          </>
        ) : (
          <>
            <Link to="/user/profile">My Account ▼</Link>
          </>
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
