// src/pages/Sales.js
import React, { useState } from 'react';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import jsPDF from 'jspdf'; // For PDF export
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import '../styles/Sales.css';

const Sales = () => {
  // Simulated customers data (can be fetched from backend API)
  const [customers] = useState([
    'John Doe',
    'Jane Smith',
    'Michael Brown',
    'Sarah Connor',
    'Emily White',
  ]);

  const [sales, setSales] = useState([
    {
      id: 1,
      customerName: 'John Doe',
      productName: 'Product A',
      quantity: 2,
      price: 50,
      total: 100,
      status: 'Pending',
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      productName: 'Product B',
      quantity: 1,
      price: 80,
      total: 80,
      status: 'Completed',
    },
  ]);

  const [formData, setFormData] = useState({
    customerName: '',
    productName: '',
    quantity: '',
    price: '',
  });

  const [filteredCustomers, setFilteredCustomers] = useState([]); // For matching customer names
  const [showDropdown, setShowDropdown] = useState(false); // Controls dropdown visibility
  const [selectedSale, setSelectedSale] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

    if (name === 'customerName') {
      // Filter customer names based on input
      if (value.trim() !== '') {
        const matches = customers.filter((customer) =>
          customer.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCustomers(matches);
        setShowDropdown(matches.length > 0);
      } else {
        setFilteredCustomers([]);
        setShowDropdown(false);
      }
    }
  };

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer) => {
    setFormData({ ...formData, customerName: customer });
    setShowDropdown(false); // Close dropdown
  };

  // Add or update a sale
  const handleSubmit = (e) => {
    e.preventDefault();
    const total = formData.quantity * formData.price;

    if (selectedSale) {
      // Update sale
      const updatedSales = sales.map((sale) =>
        sale.id === selectedSale.id ? { ...formData, id: sale.id, total, status: sale.status } : sale
      );
      setSales(updatedSales);
      setSelectedSale(null);
    } else {
      // Add new sale
      const newSale = { ...formData, id: Date.now(), total, status: 'Pending' };
      setSales([...sales, newSale]);
    }

    setFormData({ customerName: '', productName: '', quantity: '', price: '' });
  };

  // Edit sale
  const handleEditSale = (sale) => {
    setSelectedSale(sale);
    setFormData({
      customerName: sale.customerName,
      productName: sale.productName,
      quantity: sale.quantity,
      price: sale.price,
    });
  };

  // Export to Excel
  const exportAsExcel = () => {
    const worksheet = XLSXUtils.json_to_sheet(sales);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Sales');
    XLSXWriteFile(workbook, 'sales_data.xlsx');
  };

  // Export to PDF
  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.text('Sales Report', 10, 10);
    let yPosition = 20;

    sales.forEach((sale, index) => {
      doc.text(`${index + 1}. ${sale.customerName} - ${sale.productName}`, 10, yPosition);
      doc.text(`   Quantity: ${sale.quantity}, Price: $${sale.price}, Total: $${sale.total}`, 10, yPosition + 10);
      yPosition += 20;
    });

    doc.save('sales_report.pdf');
  };

  return (
    <div className="sales-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="sales-container">
          <h1>Sales</h1>

          {/* Add Sale Form */}
          <form className="sales-form" onSubmit={handleSubmit}>
            <div className="dropdown-wrapper">
              <input
                type="text"
                name="customerName"
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={handleChange}
                autoComplete="off"
                required
              />
              {/* Customer Dropdown */}
              {showDropdown && (
                <div className="dropdown">
                  {filteredCustomers.map((customer, index) => (
                    <div
                      key={index}
                      className="dropdown-item"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      {customer}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              name="productName"
              placeholder="Product Name"
              value={formData.productName}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <button type="submit">{selectedSale ? 'Update Sale' : 'Add Sale'}</button>
          </form>

          {/* Export Buttons */}
          <div className="sales-actions">
            <button onClick={exportAsExcel}>Export as Excel</button>
            <button onClick={exportAsPDF}>Export as PDF</button>
          </div>

          {/* Sales List Table */}
          <table className="sales-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.customerName}</td>
                  <td>{sale.productName}</td>
                  <td>{sale.quantity}</td>
                  <td>${sale.price}</td>
                  <td>${sale.total}</td>
                  <td>{sale.status}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleEditSale(sale)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
