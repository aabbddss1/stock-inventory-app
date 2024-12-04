// src/components/TopNavbar.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from React Router
import '../styles/TopNavbar.css';

function TopNavbar() {
  return (
    <div className="top-navbar">
      <div className="title">Qubite Stock Inventory Admin Page</div>
      <div className="nav-links">
        <a href="#">Help Center</a>
        
        {/* Admin Link */}
        <Link to="/admin-users">Admin ▼</Link> {/* Navigates to Admin Users page */}

        <a href="#">Language ▼</a>
      </div>
    </div>
  );
}

export default TopNavbar;
