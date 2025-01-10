import React from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import DashboardCards from '../components/DashboardCards';
import '../styles/AdminPanel.css';

function AdminPanel({ onOpenAddCustomer }) {
  return (
    <div className="admin-panel">
      <Sidebar />
      <div className="content">
        <TopNavbar />
        <div className="dashboard-main">
          {/* Pass the callback for opening the modal */}
          <DashboardCards onAddCustomer={onOpenAddCustomer} />
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
