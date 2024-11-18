// src/components/Sidebar.js
import React from 'react';
import logo from '../assets/logo.png'; // Adjust path based on your directory structure

import { Link } from 'react-router-dom';
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
  faEnvelopeOpenText,
  faFileInvoiceDollar,
  faDollarSign,
  faFolderOpen,
} from '@fortawesome/free-solid-svg-icons';

function Sidebar() {
  return (
    <div className="sidebar">
<div className="logo-container">
        <img src={logo} alt="GOLFPLAST Logo" className="logo" />
      </div>
      <div className="sidebar-links">
        <h3>MAIN</h3>
        <Link to="/admin">
          <FontAwesomeIcon icon={faTachometerAlt} /> Dashboard
        </Link>
        <Link to="/customers">
          <FontAwesomeIcon icon={faUsers} /> Customers
        </Link>
        <Link to="/suppliers">
          <FontAwesomeIcon icon={faTruck} /> Suppliers
        </Link>
        <Link to="/dealerships">
          <FontAwesomeIcon icon={faFileAlt} /> Dealerships
        </Link>

        <h3>OPERATIONS</h3>
        <Link to="/sales">
          <FontAwesomeIcon icon={faChartLine} /> Sales
        </Link>
        <Link to="/orders">
          <FontAwesomeIcon icon={faClipboardList} /> Orders
        </Link>
        <Link to="/quotations">
          <FontAwesomeIcon icon={faFileAlt} /> Quotations
        </Link>
        <Link to="/inventory">
          <FontAwesomeIcon icon={faWarehouse} /> Inventory
        </Link>

        <h3>ACCOUNTS</h3>
        <Link to="/receivables">
          <FontAwesomeIcon icon={faDollarSign} /> Receivables
        </Link>
        <Link to="/payables">
          <FontAwesomeIcon icon={faFileInvoiceDollar} /> Payables
        </Link>
        <Link to="/documents">
          <FontAwesomeIcon icon={faFolderOpen} /> Documents
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;
