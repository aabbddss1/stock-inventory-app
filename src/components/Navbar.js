// src/components/Navbar.js
import React from 'react';
import '../styles/Navbar.css';

function Navbar() {
  return (
    <div className="navbar">
      <input type="text" className="search-box" placeholder="Search work orders" />
      <div className="navbar-actions">
        <button className="kpi-button">KPIs</button>
        <button className="add-button">+ Work Order</button>
      </div>
    </div>
  );
}

export default Navbar;
