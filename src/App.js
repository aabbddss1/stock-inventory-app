import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Dealerships from './pages/Dealerships';
import Sales from './pages/Sales';
import Orders from './pages/Orders';
import Quotations from './pages/Quotations';
import Inventory from './pages/Inventory';
import Receivables from './pages/Receivables';
import Payables from './pages/Payables';
import Documents from './pages/Documents';
import AdminUsers from './pages/AdminUsers';
import AddCustomer from './pages/AddCustomer';
import UserPanel from './pages/UserPanel'; // Import the new User Panel
import ProtectedRoute from './components/ProtectedRoute'; // Ensure protection for specific routes
import './styles/App.css';
import SalesPage from './pages/SalesPage'; // Import the new Sales page
import UserInventory from './pages/UserInventory'; // User portal



function App() {
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // Function to open the Add Customer modal
  const handleOpenAddCustomerModal = () => {
    setIsAddCustomerModalOpen(true);
  };

  // Function to close the Add Customer modal
  const handleCloseAddCustomerModal = () => {
    setIsAddCustomerModalOpen(false);
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Main Login Page */}
          <Route path="/" element={<LoginPage />} />

          {/* Admin Panel */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel onOpenAddCustomer={handleOpenAddCustomerModal} />
              </ProtectedRoute>
            }
          />
          <Route path="/admin-users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />

          {/* User Panel */}
          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <UserPanel />
              </ProtectedRoute>
            }
          />

          {/* Other Pages */}
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/dealerships" element={<ProtectedRoute><Dealerships /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/receivables" element={<ProtectedRoute><Receivables /></ProtectedRoute>} />
          <Route path="/payables" element={<ProtectedRoute><Payables /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
          <Route path="/user/inventory" element={<UserInventory />} />


          {/* Optional Routes for Add Customer and Add Supplier */}
          <Route path="/add-customer" element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} />
        </Routes>

        {/* Add Customer Modal */}
        {isAddCustomerModalOpen && (
          <AddCustomer
            onSave={(newCustomer) => {
              console.log('Customer added:', newCustomer); // Replace with API integration
              handleCloseAddCustomerModal();
            }}
            onClose={handleCloseAddCustomerModal}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
