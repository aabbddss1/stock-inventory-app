// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import AddCustomer from './pages/AddCustomer';
import AddSupplier from './pages/AddSupplier';
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
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />



          {/* Optional Routes for Add Customer and Add Supplier */}
          <Route path="/add-customer" element={<AddCustomer />} />
          <Route path="/add-supplier" element={<AddSupplier />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
