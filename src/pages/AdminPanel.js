// src/pages/AdminPanel.js
import React from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import DashboardCards from '../components/DashboardCards';
import '../styles/AdminPanel.css';


function AdminPanel() {
  return (
    <div className="admin-panel">
      <Sidebar />
      <div className="content">
        <TopNavbar />
        <div className="dashboard-main">
          <DashboardCards />
        </div>
      </div>
    </div>
  );
}



export default AdminPanel;
