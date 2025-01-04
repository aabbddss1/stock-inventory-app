import React, { useState, useEffect, useRef } from 'react';
import '../styles/AddCustomer.css';

function AddCustomer({ onSave, onClose }) {
  const nameInputRef = useRef(null); // Ref for focusing on the Name input field
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus(); // Automatically focus on the Name input field
    }
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10-15 digits';
    }
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' }); // Clear specific error
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
      }); // Clear the form after successful save
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New Customer</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              ref={nameInputRef}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />
            {errors.phone && <p className="error-text">{errors.phone}</p>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-container">
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password or generate"
                required
              />
              <button
                type="button"
                className="generate-password-btn"
                onClick={generateRandomPassword}
              >
                Generate
              </button>
            </div>
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          <div className="form-actions">
          <button type="submit" className="add-customer-button">
  <i className="fa fa-user"></i> Add Customer
</button>

            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCustomer;
