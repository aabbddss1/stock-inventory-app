import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import '../styles/AdminPanel.css';

function AdminPanel() {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/customers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers');
      if (error.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Refresh the customer list after deletion
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Failed to delete customer');
    }
  };

  // ... rest of your component code ...
}

export default AdminPanel;
