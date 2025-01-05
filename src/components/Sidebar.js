import React from 'react';
import logo from '../assets/logo.png'; // Adjust path based on your directory structure
import { NavLink } from 'react-router-dom';
import '../styles/Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faUsers,
  faTruck,
  faFileAlt,
  faChartLine,
  faClipboardList,
  faWarehouse,
  faFileInvoiceDollar,
  faDollarSign,
  faFolderOpen,
} from '@fortawesome/free-solid-svg-icons';

function Sidebar() {
  const userRole = localStorage.getItem('role'); // Fetch user role from localStorage

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={logo} alt="QUBITE Logo" className="logo" />
      </div>
      <div className="sidebar-links">
        <h3>MAIN</h3>

        {/* Dashboard */}
        <NavLink
          to={userRole === 'admin' ? '/admin' : '/user'}
          className={({ isActive }) => (isActive ? 'active-link' : '')}
        >
          <FontAwesomeIcon icon={faTachometerAlt} /> Dashboard
        </NavLink>

        {/* Orders */}
        <NavLink
          to="/orders"
          className={({ isActive }) => (isActive ? 'active-link' : '')}
        >
          <FontAwesomeIcon icon={faClipboardList} /> Orders
        </NavLink>

        {/* Inventory */}
        {userRole === 'admin' ? (
          <NavLink
            to="/inventory"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
          >
            <FontAwesomeIcon icon={faWarehouse} /> Inventory
          </NavLink>
        ) : (
          <NavLink
            to="/user/inventory"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
          >
            <FontAwesomeIcon icon={faWarehouse} /> Inventory
          </NavLink>
        )}

        {/* Admin-Only Links */}
        {userRole === 'admin' && (
          <>
            <NavLink
              to="/customers"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <FontAwesomeIcon icon={faUsers} /> Customers
            </NavLink>
            <NavLink
              to="/suppliers"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <FontAwesomeIcon icon={faTruck} /> Suppliers
            </NavLink>
            <NavLink
              to="/dealerships"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <FontAwesomeIcon icon={faFileAlt} /> Dealerships
            </NavLink>
            <NavLink
              to="/sales"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <FontAwesomeIcon icon={faChartLine} /> Sales
            </NavLink>
            <NavLink
              to="/quotations"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <FontAwesomeIcon icon={faFileAlt} /> Quotations
            </NavLink>
          </>
        )}

        {/* User Documents */}
        <NavLink
          to="/documents"
          className={({ isActive }) => (isActive ? 'active-link' : '')}
        >
          <FontAwesomeIcon icon={faFolderOpen} /> Documents
        </NavLink>

        <h3>ACCOUNTS</h3>

        {/* Admin-Only Accounts Links */}
        {userRole === 'admin' && (
          <>
            <NavLink
              to="/receivables"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <FontAwesomeIcon icon={faDollarSign} /> Receivables
            </NavLink>
            <NavLink
              to="/payables"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <FontAwesomeIcon icon={faFileInvoiceDollar} /> Payables
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}

export default Sidebar;