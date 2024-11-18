// src/pages/Suppliers.js
import React, { useState } from 'react';
import TopNavbar from '../components/TopNavbar';
import Sidebar from '../components/Sidebar';
import '../styles/Suppliers.css';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: 'Acme Supplies', email: 'info@acme.com', phone: '555-123-4567' },
    { id: 2, name: 'Global Traders', email: 'contact@globaltraders.com', phone: '555-987-6543' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);

  const handleAddSupplier = () => {
    setShowModal(true);
    setCurrentSupplier(null); // Clear for new supplier
  };

  const handleEditSupplier = (supplier) => {
    setShowModal(true);
    setCurrentSupplier(supplier); // Set supplier data for editing
  };

  const handleDeleteSupplier = (id) => {
    setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
  };

  const handleSaveSupplier = (supplier) => {
    if (supplier.id) {
      // Edit existing supplier
      setSuppliers(suppliers.map((s) => (s.id === supplier.id ? supplier : s)));
    } else {
      // Add new supplier
      setSuppliers([...suppliers, { ...supplier, id: Date.now() }]);
    }
    setShowModal(false);
  };

  return (
    <div className="admin-panel">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="suppliers-page">
          <div className="suppliers-header">
            <h2>Suppliers</h2>
            <button className="add-supplier-btn" onClick={handleAddSupplier}>
              Add Supplier
            </button>
          </div>
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.phone}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEditSupplier(supplier)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteSupplier(supplier.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showModal && (
            <SupplierModal
              supplier={currentSupplier}
              onSave={handleSaveSupplier}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SupplierModal({ supplier, onSave, onClose }) {
  const [formData, setFormData] = useState(
    supplier || { name: '', email: '', phone: '' }
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
        <h3>{supplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
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

export default Suppliers;
