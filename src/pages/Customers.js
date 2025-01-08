import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import '../styles/Customers.css';
import axios from 'axios';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const token = localStorage.getItem('token');
  const axiosInstance = React.useMemo(() => {
    return axios.create({
      baseURL: 'http://localhost:5001/api',
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  useEffect(() => {
    if (!token) {
      console.error('No token found. Redirecting to login.');
      window.location.href = '/';
      return;
    }

    axiosInstance
      .get('/customers')
      .then((response) => {
        const userCustomers = response.data.filter(customer => 
          customer.role?.toLowerCase() === 'user' || !customer.role
        );
        setCustomers(userCustomers);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching customers:', error);
        if (error.response?.status === 401) {
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/';
        }
        setLoading(false);
      });
  }, [token]);

  // Handle adding a new customer
  const handleAdd = () => {
    setEditingCustomer(null);
    setShowModal(true);
  };

  // Handle saving a customer (add or edit)
  const handleSave = (customer) => {
    const token = localStorage.getItem('token');
  
    // Add a new customer
    axios
      .post(
        'http://localhost:5001/api/customers',
        {
          ...customer,
          role: 'user', // Ensure new customers are created as users
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        setCustomers([...customers, response.data]);
        setShowModal(false);
      })
      .catch((error) => {
        console.error('Error adding customer:', error);
        if (error.response?.status === 401) {
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/';
        }
      });
  };
  
  

  // Handle deleting a customer
  const handleDelete = (id) => {
    const customerName = customers.find((customer) => customer.id === id)?.name;
    if (window.confirm(`Are you sure you want to delete ${customerName}?`)) {
      axiosInstance
        .delete(`/customers/${id}`)
        .then(() => {
          setCustomers((prev) => prev.filter((customer) => customer.id !== id));
        })
        .catch((error) => {
          console.error('Error deleting customer:', error);
          if (error.response?.status === 401) {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = '/';
          }
        });
    }
  };

  return (
    <div className="admin-panel">
      <Sidebar />
      <div className="content">
        <TopNavbar />
        <div className="dashboard-main">
          <div className="customers-header">
            <h2>Customers</h2>
            <button className="add-customer-btn" onClick={handleAdd}>
  <i className="fa fa-user-plus"></i> Add Customer
</button>

          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Password</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{'********'}</td>
                    <td>
                      <button
                        className="customers-edit-btn"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setShowModal(true);
                        }}
                      >
                        <i className="fas fa-edit"></i>
                        Edit
                      </button>
                      <button
                        className="customers-delete-btn"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <i className="fas fa-trash"></i>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {showModal && (
            <CustomerModal
              customer={editingCustomer}
              onSave={handleSave}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Modal component for adding/editing customer details
function CustomerModal({ customer, onSave, onClose }) {
  const [formData, setFormData] = useState(
    customer || { name: '', email: '', phone: '', password: '' }
  );
  const [errors, setErrors] = useState({});

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

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
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
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
            placeholder="Enter full name"
            required
          />
          {errors.name && <p className="error-text">{errors.name}</p>}

          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            required
          />
          {errors.email && <p className="error-text">{errors.email}</p>}

          <label>Phone:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            required
          />
          {errors.phone && <p className="error-text">{errors.phone}</p>}

          <label>Password:</label>
          <div className="password-container">
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter or generate a password"
              required
            />
            <button
              type="button"
              className="generate-password-btn"
              onClick={generateRandomPassword}
            >
              <i className="fa fa-random"></i>
              Randomize
            </button>
          </div>
          {errors.password && <p className="error-text">{errors.password}</p>}

          <div className="modal-actions">
            <button type="submit" className="save-btn">
              <i className="fa fa-save"></i>
              Save
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              <i className="fa fa-x"></i>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Customers;
