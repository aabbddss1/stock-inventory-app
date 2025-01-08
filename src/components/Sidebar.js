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
      <h3 className="hidingtext">Main</h3>

        {/* Dashboard */}
        <NavLink
          to={userRole === 'admin' ? '/admin' : '/user'}
          className={({ isActive }) => (isActive ? 'active-link' : '')}
          end // Ensure exact match for the dashboard route
        >
          <FontAwesomeIcon icon={faTachometerAlt} /> <span className="hidingtext">Dashboard</span>
        </NavLink>

        {/* Orders */}
        <NavLink
          to="/orders"
          className={({ isActive }) => (isActive ? 'active-link' : '')}
        >
<FontAwesomeIcon icon={faClipboardList} /> <span className="hidingtext">Orders</span>
</NavLink>

        {/* Inventory */}
        {userRole === 'admin' ? (
          <NavLink
            to="/inventory"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
            end // Ensure exact match for admin inventory
          >
            <FontAwesomeIcon icon={faWarehouse} /> <span className="hidingtext">Inventory</span>
          </NavLink>
        ) : (
          <NavLink
            to="/user/inventory"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
            end // Ensure exact match for user inventory
          >
            <FontAwesomeIcon icon={faWarehouse} /> <span className="hidingtext">Inventory</span>
          </NavLink>
        )}

        {/* Admin-Only Links */}
        {userRole === 'admin' && (
          <>
            <NavLink
              to="/customers"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faUsers} /> <span className="hidingtext">Customers</span>
            </NavLink>
            <NavLink
              to="/suppliers"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faTruck} /> <span className="hidingtext">Suppliers</span>
            </NavLink>
            <NavLink
              to="/dealerships"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faFileAlt} /> <span className="hidingtext">Dealerships</span>
            </NavLink>
            <NavLink
              to="/sales"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faChartLine} /> <span className="hidingtext">Sales</span>
            </NavLink>
            <NavLink
              to="/quotations"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faFileAlt} /> <span className="hidingtext">Quotations</span>
            </NavLink>
          </>
        )}

        {/* Documents Links */}
        {userRole === 'admin' ? (
          <NavLink
            to="/documents"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
            end
          >
            <FontAwesomeIcon icon={faFolderOpen} /> <span className="hidingtext">Documents</span>
          </NavLink>
        ) : (
          <NavLink
            to="/user/documents"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
            end
          >
            <FontAwesomeIcon icon={faFolderOpen} /> <span className="hidingtext">My Documents</span>
          </NavLink>
        )}

        <h3 className="hidingtext">ACCOUNTS</h3>

        {/* Admin-Only Accounts Links */}
        {userRole === 'admin' && (
          <>
            <NavLink
              to="/receivables"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faDollarSign} /> <span className="hidingtext">Receivables</span>
            </NavLink>
            <NavLink
              to="/payables"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faFileInvoiceDollar} /> <span className="hidingtext">Payables</span>
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
