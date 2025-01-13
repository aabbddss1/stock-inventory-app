import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import '../styles/Customers.css';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function Customers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      console.error('No token found. Redirecting to login.');
      window.location.href = '/';
      return;
    }

    axios.get('http://37.148.210.169:5001/api/customers', {
      headers: { Authorization: `Bearer ${token}` }
    })
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
 // Handle saving a customer (add or edit)
 const handleSave = async (customer) => {
  const token = localStorage.getItem('token');


  try {
    const response = await axios.post(
      'http://localhost:5001/api/customers',
      {
        ...customer,
        role: 'user',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setCustomers([...customers, response.data]);
    setShowModal(false);
  } catch (error) {
    console.error('Error adding customer:', error);
    if (error.response?.status === 401) {
      alert('Session expired. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

  
  

  // Handle deleting a customer
  const handleDelete = (id) => {
    const customerName = customers.find((customer) => customer.id === id)?.name;
    if (window.confirm(`${t('customers.confirmDelete')} ${customerName}?`)) {
      axios.delete(`http://37.148.210.169:5001/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
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
            <h2>{t('customers.title')}</h2>
            <button className="add-customer-btn" onClick={handleAdd}>
              <i className="fa fa-user-plus"></i> {t('customers.addCustomer')}
            </button>
          </div>
          {loading ? (
            <p>{t('customers.loading')}</p>
          ) : (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>{t('customers.tableHeaders.id')}</th>
                  <th>{t('customers.tableHeaders.name')}</th>
                  <th>{t('customers.tableHeaders.email')}</th>
                  <th>{t('customers.tableHeaders.phone')}</th>
                  <th>{t('customers.tableHeaders.password')}</th>
                  <th>{t('customers.tableHeaders.actions')}</th>
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
                        {t('customers.actions.edit')}
                      </button>
                      <button
                        className="customers-delete-btn"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <i className="fas fa-trash"></i>
                        {t('customers.actions.delete')}
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
  const { t } = useTranslation();
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
    if (!formData.name.trim()) newErrors.name = t('customers.validation.nameRequired');
    if (!formData.email.trim()) {
      newErrors.email = t('customers.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('customers.validation.emailInvalid');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('customers.validation.phoneRequired');
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = t('customers.validation.phoneInvalid');
    }
    if (!formData.password.trim()) {
      newErrors.password = t('customers.validation.passwordRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        await onSave(formData);
      } finally {
        setLoading(false);
      }
    }
  };




  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{customer ? t('customers.modal.editCustomer') : t('customers.modal.addCustomer')}</h3>
        <form onSubmit={handleSubmit}>
          <label>{t('customers.modal.name')}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('customers.modal.enterFullName')}
            required
          />
          {errors.name && <p className="error-text">{errors.name}</p>}

          <label>{t('customers.modal.email')}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('customers.modal.enterEmail')}
            required
          />
          {errors.email && <p className="error-text">{errors.email}</p>}

          <label>{t('customers.modal.phone')}</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t('customers.modal.enterPhone')}
            required
          />
          {errors.phone && <p className="error-text">{errors.phone}</p>}

          <label>{t('customers.modal.password')}</label>
          <div className="password-container">
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('customers.modal.enterPassword')}
              required
            />
            <button
              type="button"
              className="generate-password-btn"
              onClick={generateRandomPassword}
            >
              <i className="fa fa-random"></i>
              {t('customers.modal.randomize')}
            </button>
          </div>
          {errors.password && <p className="error-text">{errors.password}</p>}

          <div className="modal-actions">
            <button type="submit" className="save-btn">
              <i className="fa fa-save"></i>
              {t('customers.modal.save')}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              <i className="fa fa-x"></i>
              {t('customers.modal.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Customers;
