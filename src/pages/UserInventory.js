import React, { useState, useEffect } from 'react';
import axios from 'axios'; // For API calls
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export

import '../styles/Inventory.css';

const UserInventory = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  const fetchInventory = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    try {
      const response = await axios.get('http://37.148.210.169:5001/api/inventory', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
    // Set up an interval to check for token and fetch data
    const intervalId = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && products.length === 0) {
        fetchInventory();
      }
    }, 1000); // Check every second

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [products.length]);

  // Search functionality
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) ||
        product.category.toLowerCase().includes(value)
    );
    setFilteredProducts(filtered);
  };

  // Export to Excel
  const exportAsExcel = () => {
    const worksheet = XLSXUtils.json_to_sheet(products);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSXWriteFile(workbook, 'inventory_data.xlsx');
  };

  // Function to apply CSS class based on status
  const getStatusClass = (status) => {
    switch (status) {
      case 'In Stock':
        return 'in-stock';
      case 'Low Stock':
        return 'low-stock';
      case 'Out of Stock':
        return 'out-of-stock';
      default:
        return '';
    }
  };

  return (
    <div className="inventory-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="inventory-container">
          <h1>Inventory</h1>

          {/* Search and Export */}
          <div className="inventory-export">
            <input
              type="text"
              placeholder="Search by name or category"
              value={searchTerm}
              onChange={handleSearch}
            />
            <button className="export-button" onClick={exportAsExcel}>
  <i className="fa fa-th"></i> Export to Excel
</button>
          </div>

          {/* Inventory Table */}
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.quantity}</td>
                  <td>${product.price}</td>
                  <td className={`status-cell ${getStatusClass(product.status)}`}>
                    {product.status}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserInventory;
