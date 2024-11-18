// src/pages/AddCustomer.js
import React, { useState } from 'react';
import '../styles/AddCustomer.css';

function AddCustomer() {
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prevCustomer) => ({
      ...prevCustomer,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Customer Details:', customer);
    // Logic to handle form submission, e.g., API call to add customer
  };

  return (
    <div className="add-customer-page">
      <div className="add-customer-card">
        <h2>Add New Customer</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={customer.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={customer.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={customer.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={customer.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={customer.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={customer.postalCode}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Customer
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddCustomer;
