// src/pages/Customers.js
import React, { useState } from 'react';
import TopNavbar from '../components/TopNavbar';
import Sidebar from '../components/Sidebar';
import '../styles/Customers.css';

function Customers() {
  const [customers, setCustomers] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', phone: '987-654-3210' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  const handleAddCustomer = () => {
    setShowModal(true);
    setCurrentCustomer(null); // Clear for new customer
  };

  const handleEditCustomer = (customer) => {
    setShowModal(true);
    setCurrentCustomer(customer); // Set customer data for editing
  };

  const handleDeleteCustomer = (id) => {
    setCustomers(customers.filter((customer) => customer.id !== id));
  };

  const handleSaveCustomer = (customer) => {
    if (customer.id) {
      // Edit existing customer
      setCustomers(customers.map((c) => (c.id === customer.id ? customer : c)));
    } else {
      // Add new customer
      setCustomers([...customers, { ...customer, id: Date.now() }]);
    }
    setShowModal(false);
  };

  return (
    <div className="admin-panel">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="customers-page">
          <div className="customers-header">
            <h2>Customers</h2>
            <button className="add-customer-btn" onClick={handleAddCustomer}>
              Add Customer
            </button>
          </div>
          <table className="customers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteCustomer(customer.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showModal && (
            <CustomerModal
              customer={currentCustomer}
              onSave={handleSaveCustomer}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerModal({ customer, onSave, onClose }) {
  const [formData, setFormData] = useState(
    customer || { name: '', email: '', phone: '' }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{customer ? 'Edit Customer' : 'Add Customer'}</h3>
        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <label>Phone:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <div className="modal-actions">
            <button type="submit" className="save-btn">
              Save
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Customers;
