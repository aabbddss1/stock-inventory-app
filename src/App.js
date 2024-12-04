// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import AddCustomer from './pages/AddCustomer';
import AddSupplier from './pages/AddSupplier';
import Dealerships from './pages/Dealerships'; // Import the Dealerships component
import Sales from './pages/Sales';
import Orders from './pages/Orders';
import Quotations from './pages/Quotations';
import Inventory from './pages/Inventory';
import Receivables from './pages/Receivables';
import Payables from './pages/Payables';
import Documents from './pages/Documents';
import AdminUsers from './pages/AdminUsers'; // Import the AdminUsers page



import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Main Login Page */}
          <Route path="/" element={<LoginPage />} />

          {/* Admin Panel */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin-users" element={<AdminUsers />} />

          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/dealerships" element={<Dealerships />} /> {/* New Dealerships page */}
          <Route path="/sales" element={<Sales />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/receivables" element={<Receivables />} />
          <Route path="/payables" element={<Payables/>} />
          <Route path="/documents" element={<Documents/>} />






          {/* Optional Routes for Add Customer and Add Supplier */}
          <Route path="/add-customer" element={<AddCustomer />} />
          <Route path="/add-supplier" element={<AddSupplier />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
