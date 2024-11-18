// src/components/TopNavbar.js
import React from 'react';
import '../styles/TopNavbar.css';

function TopNavbar() {
  return (
    <div className="top-navbar">
      <div className="title">GOLFPLAST Stock Inventory Admin Page</div>
      <div className="nav-links">
        <a href="#">Help Center</a>
        <a href="#">Admin ▼</a>
        <a href="#">Language ▼</a>
      </div>
    </div>
  );
}

export default TopNavbar;
