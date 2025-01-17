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
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

function Sidebar() {
  const { t } = useTranslation('sidebar');
  const userRole = localStorage.getItem('role');

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={logo} alt="QUBITE Logo" className="logo" />
      </div>
      <div className="sidebar-links">
        <h3 className="hidingtext">{t('main')}</h3>

        {/* Dashboard */}
        <NavLink
          to={userRole === 'admin' ? '/admin' : '/user'}
          className={({ isActive }) => (isActive ? 'active-link' : '')}
          end
        >
          <FontAwesomeIcon icon={faTachometerAlt} /> <span className="hidingtext">{t('dashboard')}</span>
        </NavLink>

        {/* Orders */}
        <NavLink
          to="/orders"
          className={({ isActive }) => (isActive ? 'active-link' : '')}
        >
          <FontAwesomeIcon icon={faClipboardList} /> <span className="hidingtext">{t('orders')}</span>
        </NavLink>

        {/* Inventory */}
        {userRole === 'admin' ? (
          <NavLink
            to="/inventory"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
            end
          >
            <FontAwesomeIcon icon={faWarehouse} /> <span className="hidingtext">{t('inventory')}</span>
          </NavLink>
        ) : (
          <NavLink
            to="/user/inventory"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
            end
          >
            <FontAwesomeIcon icon={faWarehouse} /> <span className="hidingtext">{t('inventory')}</span>
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
              <FontAwesomeIcon icon={faUsers} /> <span className="hidingtext">{t('customers')}</span>
            </NavLink>
            <NavLink
              to="/suppliers"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faTruck} /> <span className="hidingtext">{t('suppliers')}</span>
            </NavLink>
            <NavLink
              to="/dealerships"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faFileAlt} /> <span className="hidingtext">{t('dealerships')}</span>
            </NavLink>
            <NavLink
              to="/sales"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faChartLine} /> <span className="hidingtext">{t('sales')}</span>
            </NavLink>
            <NavLink
              to="/quotations"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faFileAlt} /> <span className="hidingtext">{t('quotations')}</span>
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faChartBar} /> <span className="hidingtext">{t('reports')}</span>
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
            <FontAwesomeIcon icon={faFolderOpen} /> <span className="hidingtext">{t('documents')}</span>
          </NavLink>
        ) : (
          <NavLink
            to="/user/documents"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
            end
          >
            <FontAwesomeIcon icon={faFolderOpen} /> <span className="hidingtext">{t('myDocuments')}</span>
          </NavLink>
        )}

        <h3 className="hidingtext">{t('accounts')}</h3>

        {/* Admin-Only Accounts Links */}
        {userRole === 'admin' && (
          <>
            <NavLink
              to="/receivables"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faDollarSign} /> <span className="hidingtext">{t('receivables')}</span>
            </NavLink>
            <NavLink
              to="/payables"
              className={({ isActive }) => (isActive ? 'active-link' : '')}
              end
            >
              <FontAwesomeIcon icon={faFileInvoiceDollar} /> <span className="hidingtext">{t('payables')}</span>
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
