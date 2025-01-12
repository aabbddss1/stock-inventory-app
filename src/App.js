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
import UserDocuments from './pages/UserDocuments';



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
          {/* Public routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<UserPanel />} />
          
          {/* Admin-only routes */}
          <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin-users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute adminOnly><Suppliers /></ProtectedRoute>} />
          <Route path="/dealerships" element={<ProtectedRoute adminOnly><Dealerships /></ProtectedRoute>} />
          
          {/* Shared routes (accessible by both admin and regular users) */}
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
          
          {/* User-specific routes */}
          <Route path="/user/inventory" element={<ProtectedRoute><UserInventory /></ProtectedRoute>} />
          <Route path="/user/documents" element={<ProtectedRoute><UserDocuments /></ProtectedRoute>} />
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
