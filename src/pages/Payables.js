// src/pages/Payables.js
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import jsPDF from 'jspdf'; // For PDF export
import '../styles/Payables.css';

const Payables = () => {
  const [payables, setPayables] = useState([
    {
      id: 1,
      supplierName: 'Supplier A',
      invoiceNumber: 'INV101',
      amountOwed: 800,
      dueDate: '2024-11-25',
      status: 'Pending',
    },
    {
      id: 2,
      supplierName: 'Supplier B',
      invoiceNumber: 'INV102',
      amountOwed: 1200,
      dueDate: '2024-11-15',
      status: 'Overdue',
    },
  ]);

  const [formData, setFormData] = useState({
    supplierName: '',
    invoiceNumber: '',
    amountOwed: '',
    dueDate: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayable, setSelectedPayable] = useState(null);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add or update payable
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedPayable) {
      // Update payable
      const updatedPayables = payables.map((payable) =>
        payable.id === selectedPayable.id
          ? { ...formData, id: payable.id, status: payable.status }
          : payable
      );
      setPayables(updatedPayables);
      setSelectedPayable(null);
    } else {
      // Add new payable
      const newPayable = {
        ...formData,
        id: Date.now(),
        status: 'Pending',
      };
      setPayables([...payables, newPayable]);
    }

    setFormData({ supplierName: '', invoiceNumber: '', amountOwed: '', dueDate: '' });
  };

  // Edit payable
  const handleEdit = (payable) => {
    setSelectedPayable(payable);
    setFormData({
      supplierName: payable.supplierName,
      invoiceNumber: payable.invoiceNumber,
      amountOwed: payable.amountOwed,
      dueDate: payable.dueDate,
    });
  };

  // Delete payable
  const handleDelete = (id) => {
    const updatedPayables = payables.filter((payable) => payable.id !== id);
    setPayables(updatedPayables);
  };

  // Mark as Paid
  const handleMarkAsPaid = (id) => {
    const updatedPayables = payables.map((payable) =>
      payable.id === id ? { ...payable, status: 'Paid' } : payable
    );
    setPayables(updatedPayables);
  };

  // Search functionality
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
  };

  // Export to Excel
  const exportAsExcel = () => {
    const worksheet = XLSXUtils.json_to_sheet(payables);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Payables');
    XLSXWriteFile(workbook, 'payables_data.xlsx');
  };

  // Export to PDF
  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.text('Payables Report', 10, 10);
    let yPosition = 20;

    payables.forEach((payable, index) => {
      doc.text(
        `${index + 1}. ${payable.supplierName} - ${payable.invoiceNumber}`,
        10,
        yPosition
      );
      doc.text(
        `   Amount Owed: $${payable.amountOwed}, Due Date: ${payable.dueDate}, Status: ${payable.status}`,
        10,
        yPosition + 10
      );
      yPosition += 20;
    });

    doc.save('payables_report.pdf');
  };

  return (
    <div className="payables-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="payables-container">
          <h1>Payables</h1>

          {/* Search and Export */}
          <div className="payables-actions">
            <input
              type="text"
              placeholder="Search by supplier or invoice"
              value={searchTerm}
              onChange={handleSearch}
            />
            <button onClick={exportAsExcel}>Export as Excel</button>
            <button onClick={exportAsPDF}>Export as PDF</button>
          </div>

          {/* Add/Edit Payable Form */}
          <form className="payables-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="supplierName"
              placeholder="Supplier Name"
              value={formData.supplierName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="invoiceNumber"
              placeholder="Invoice Number"
              value={formData.invoiceNumber}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="amountOwed"
              placeholder="Amount Owed"
              value={formData.amountOwed}
              onChange={handleChange}
              required
            />
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
            <button type="submit">
              {selectedPayable ? 'Update Payable' : 'Add Payable'}
            </button>
          </form>

          {/* Payables List Table */}
          <table className="payables-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Invoice Number</th>
                <th>Amount Owed</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payables
                .filter(
                  (payable) =>
                    payable.supplierName.toLowerCase().includes(searchTerm) ||
                    payable.invoiceNumber.toLowerCase().includes(searchTerm)
                )
                .map((payable) => (
                  <tr key={payable.id}>
                    <td>{payable.supplierName}</td>
                    <td>{payable.invoiceNumber}</td>
                    <td>${payable.amountOwed}</td>
                    <td>{payable.dueDate}</td>
                    <td>{payable.status}</td>
                    <td>
                      <button onClick={() => handleEdit(payable)}>Edit</button>
                      <button onClick={() => handleDelete(payable.id)}>Delete</button>
                      {payable.status !== 'Paid' && (
                        <button onClick={() => handleMarkAsPaid(payable.id)}>Mark as Paid</button>
                      )}
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

export default Payables;
