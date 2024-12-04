// src/pages/Receivables.js
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import jsPDF from 'jspdf'; // For PDF export
import '../styles/Receivables.css';

const Receivables = () => {
  const [receivables, setReceivables] = useState([
    {
      id: 1,
      clientName: 'John Doe',
      invoiceNumber: 'INV001',
      amountDue: 500,
      dueDate: '2024-11-30',
      status: 'Pending',
    },
    {
      id: 2,
      clientName: 'Jane Smith',
      invoiceNumber: 'INV002',
      amountDue: 300,
      dueDate: '2024-11-20',
      status: 'Overdue',
    },
  ]);

  const [formData, setFormData] = useState({
    clientName: '',
    invoiceNumber: '',
    amountDue: '',
    dueDate: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceivable, setSelectedReceivable] = useState(null);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add or update receivable
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedReceivable) {
      // Update receivable
      const updatedReceivables = receivables.map((receivable) =>
        receivable.id === selectedReceivable.id
          ? { ...formData, id: receivable.id, status: receivable.status }
          : receivable
      );
      setReceivables(updatedReceivables);
      setSelectedReceivable(null);
    } else {
      // Add new receivable
      const newReceivable = {
        ...formData,
        id: Date.now(),
        status: 'Pending',
      };
      setReceivables([...receivables, newReceivable]);
    }

    setFormData({ clientName: '', invoiceNumber: '', amountDue: '', dueDate: '' });
  };

  // Edit receivable
  const handleEdit = (receivable) => {
    setSelectedReceivable(receivable);
    setFormData({
      clientName: receivable.clientName,
      invoiceNumber: receivable.invoiceNumber,
      amountDue: receivable.amountDue,
      dueDate: receivable.dueDate,
    });
  };

  // Delete receivable
  const handleDelete = (id) => {
    const updatedReceivables = receivables.filter((receivable) => receivable.id !== id);
    setReceivables(updatedReceivables);
  };

  // Mark as Paid
  const handleMarkAsPaid = (id) => {
    const updatedReceivables = receivables.map((receivable) =>
      receivable.id === id ? { ...receivable, status: 'Paid' } : receivable
    );
    setReceivables(updatedReceivables);
  };

  // Search functionality
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
  };

  // Export to Excel
  const exportAsExcel = () => {
    const worksheet = XLSXUtils.json_to_sheet(receivables);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Receivables');
    XLSXWriteFile(workbook, 'receivables_data.xlsx');
  };

  // Export to PDF
  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.text('Receivables Report', 10, 10);
    let yPosition = 20;

    receivables.forEach((receivable, index) => {
      doc.text(
        `${index + 1}. ${receivable.clientName} - ${receivable.invoiceNumber}`,
        10,
        yPosition
      );
      doc.text(
        `   Amount Due: $${receivable.amountDue}, Due Date: ${receivable.dueDate}, Status: ${receivable.status}`,
        10,
        yPosition + 10
      );
      yPosition += 20;
    });

    doc.save('receivables_report.pdf');
  };

  return (
    <div className="receivables-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="receivables-container">
          <h1>Receivables</h1>

          {/* Search and Export */}
          <div className="receivables-actions">
            <input
              type="text"
              placeholder="Search by client or invoice"
              value={searchTerm}
              onChange={handleSearch}
            />
            <button onClick={exportAsExcel}>Export as Excel</button>
            <button onClick={exportAsPDF}>Export as PDF</button>
          </div>

          {/* Add/Edit Receivable Form */}
          <form className="receivables-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="clientName"
              placeholder="Client Name"
              value={formData.clientName}
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
              name="amountDue"
              placeholder="Amount Due"
              value={formData.amountDue}
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
              {selectedReceivable ? 'Update Receivable' : 'Add Receivable'}
            </button>
          </form>

          {/* Receivables List Table */}
          <table className="receivables-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Invoice Number</th>
                <th>Amount Due</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receivables
                .filter(
                  (receivable) =>
                    receivable.clientName.toLowerCase().includes(searchTerm) ||
                    receivable.invoiceNumber.toLowerCase().includes(searchTerm)
                )
                .map((receivable) => (
                  <tr key={receivable.id}>
                    <td>{receivable.clientName}</td>
                    <td>{receivable.invoiceNumber}</td>
                    <td>${receivable.amountDue}</td>
                    <td>{receivable.dueDate}</td>
                    <td>{receivable.status}</td>
                    <td>
                      <button onClick={() => handleEdit(receivable)}>Edit</button>
                      <button onClick={() => handleDelete(receivable.id)}>Delete</button>
                      {receivable.status !== 'Paid' && (
                        <button onClick={() => handleMarkAsPaid(receivable.id)}>Mark as Paid</button>
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

export default Receivables;
