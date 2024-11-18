// src/pages/AddSupplier.js
import React, { useState } from 'react';
import '../styles/AddSupplier.css';

function AddSupplier() {
  const [supplier, setSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSupplier((prevSupplier) => ({
      ...prevSupplier,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Supplier Details:', supplier);
    // Logic to handle form submission, e.g., API call to add supplier
  };

  return (
    <div className="add-supplier-page">
      <div className="add-supplier-card">
        <h2>Add New Supplier</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={supplier.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={supplier.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={supplier.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={supplier.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={supplier.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={supplier.postalCode}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Supplier
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddSupplier;
