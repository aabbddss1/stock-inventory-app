// src/pages/Quotations.js
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx';
import jsPDF from 'jspdf';
import '../styles/Quotations.css';


const Quotations = () => {
  const [quotations, setQuotations] = useState([
    {
      id: 1,
      clientName: 'John Doe',
      date: '2024-11-18',
      items: [
        { productName: 'Product A', quantity: 2, price: 50 },
        { productName: 'Product B', quantity: 1, price: 80 },
      ],
      total: 180,
      status: 'Sent',
    },
  ]);

  const [formData, setFormData] = useState({
    clientName: '',
    date: '',
    items: [{ productName: '', quantity: '', price: '' }],
    status: 'Draft',
  });

  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add or update quotation
  const handleSubmit = (e) => {
    e.preventDefault();

    const total = formData.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    if (selectedQuotation) {
      // Update quotation
      const updatedQuotations = quotations.map((quotation) =>
        quotation.id === selectedQuotation.id
          ? { ...formData, id: quotation.id, total }
          : quotation
      );
      setQuotations(updatedQuotations);
      setSelectedQuotation(null);
    } else {
      // Add new quotation
      const newQuotation = {
        ...formData,
        id: Date.now(),
        total,
      };
      setQuotations([...quotations, newQuotation]);
    }

    setFormData({
      clientName: '',
      date: '',
      items: [{ productName: '', quantity: '', price: '' }],
      status: 'Draft',
    });
  };

  // Edit quotation
  const handleEdit = (quotation) => {
    setSelectedQuotation(quotation);
    setFormData(quotation);
  };

  // Export to Excel
  const exportAsExcel = () => {
    const worksheet = XLSXUtils.json_to_sheet(quotations);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Quotations');
    XLSXWriteFile(workbook, 'quotations_data.xlsx');
  };

  // Export to PDF
  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.text('Quotations Report', 10, 10);
    let yPosition = 20;

    quotations.forEach((quotation, index) => {
      doc.text(`${index + 1}. ${quotation.clientName}`, 10, yPosition);
      doc.text(
        `   Date: ${quotation.date}, Total: $${quotation.total}, Status: ${quotation.status}`,
        10,
        yPosition + 10
      );
      yPosition += 20;
    });

    doc.save('quotations_report.pdf');
  };

  return (
    <div className="quotations-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="quotations-container">
          <h1>Quotations</h1>

          {/* Add/Edit Quotation Form */}
          <form className="quotation-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="clientName"
              placeholder="Client Name"
              value={formData.clientName}
              onChange={handleChange}
              required
            />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
            <div className="items">
              {formData.items.map((item, index) => (
                <div key={index} className="item-row">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={item.productName}
                    onChange={(e) => {
                      const updatedItems = [...formData.items];
                      updatedItems[index].productName = e.target.value;
                      setFormData({ ...formData, items: updatedItems });
                    }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => {
                      const updatedItems = [...formData.items];
                      updatedItems[index].quantity = +e.target.value;
                      setFormData({ ...formData, items: updatedItems });
                    }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => {
                      const updatedItems = [...formData.items];
                      updatedItems[index].price = +e.target.value;
                      setFormData({ ...formData, items: updatedItems });
                    }}
                    required
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    items: [...formData.items, { productName: '', quantity: '', price: '' }],
                  })
                }
              >
                Add Item
              </button>
            </div>
            <button type="submit">{selectedQuotation ? 'Update' : 'Add'} Quotation</button>
          </form>

          {/* Export Buttons */}
          <div className="quotations-actions">
            <button onClick={exportAsExcel}>Export as Excel</button>
            <button onClick={exportAsPDF}>Export as PDF</button>
          </div>

          {/* Quotations Table */}
          <table className="quotations-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td>{quotation.clientName}</td>
                  <td>{quotation.date}</td>
                  <td>${quotation.total}</td>
                  <td>{quotation.status}</td>
                  <td>
                    <button onClick={() => handleEdit(quotation)}>Edit</button>
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

export default Quotations;
