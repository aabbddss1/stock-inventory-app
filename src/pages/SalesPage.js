// src/pages/SalesPage.js
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import axios from 'axios';
import '../styles/SalesPage.css';

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [newSale, setNewSale] = useState({ productName: '', saleAmount: '' });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token'); // Retrieve the token from localStorage

  // Fetch user's sales/orders
  useEffect(() => {
    axios
      .get('http://localhost:5001/api/sales', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setSales(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching sales:', error);
        setLoading(false);
      });
  }, [token]);

  // Handle new sale form submission
  const handleCreateSale = (e) => {
    e.preventDefault();
    axios
      .post(
        'http://localhost:5001/api/sales',
        newSale,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setSales([...sales, response.data]); // Update sales list
        setNewSale({ productName: '', saleAmount: '' }); // Reset form
      })
      .catch((error) => {
        console.error('Error creating sale:', error);
      });
  };

  return (
    <div className="sales-page">
      <Sidebar />
      <div className="content">
        <TopNavbar />
        <div className="dashboard-main">
          <h2>My Sales</h2>
          <div className="sales-form">
            <h3>Create New Sale</h3>
            <form onSubmit={handleCreateSale}>
              <input
                type="text"
                placeholder="Product Name"
                value={newSale.productName}
                onChange={(e) => setNewSale({ ...newSale, productName: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Sale Amount"
                value={newSale.saleAmount}
                onChange={(e) => setNewSale({ ...newSale, saleAmount: e.target.value })}
                required
              />
              <button type="submit">Create Sale</button>
            </form>
          </div>

          <div className="sales-list">
            <h3>My Sales</h3>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Product Name</th>
                    <th>Sale Amount</th>
                    <th>Status</th>
                    <th>Sale Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.id}</td>
                      <td>{sale.productName}</td>
                      <td>${sale.saleAmount}</td>
                      <td>{sale.status}</td>
                      <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesPage;
