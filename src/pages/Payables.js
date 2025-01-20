// src/pages/Payables.js
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import jsPDF from 'jspdf'; // For PDF export
import axios from 'axios';
import '../styles/Payables.css';
import { useTranslation } from 'react-i18next';

const Payables = () => {
  const { t } = useTranslation();
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(null);

  const [formData, setFormData] = useState({
    supplierName: '',
    invoiceNumber: '',
    amountOwed: '',
    dueDate: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayable, setSelectedPayable] = useState(null);

  const token = localStorage.getItem('token');
  const userData = JSON.parse(atob(token.split('.')[1]));
  const userRole = userData.role;

  // Fetch payables
  useEffect(() => {
    fetchPayables();
  }, []);

  const fetchPayables = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://37.148.210.169:5001/api/payables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayables(response.data);
    } catch (error) {
      console.error('Error fetching payables:', error);
      alert('Failed to fetch payables');
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add or update payable
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPayable) {
        // Update payable
        await axios.put(
          `http://37.148.210.169:5001/api/payables/${selectedPayable.id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Add new payable
        await axios.post(
          'http://37.148.210.169:5001/api/payables',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Refresh payables list
      fetchPayables();
      
      // Reset form
      setFormData({
        supplierName: '',
        invoiceNumber: '',
        amountOwed: '',
        dueDate: ''
      });
      setSelectedPayable(null);
      
    } catch (error) {
      console.error('Error saving payable:', error);
      alert('Failed to save payable');
    }
  };

  // Handle status change
  const handleStatusChange = async (payableId, newStatus) => {
    try {
      setStatusLoading(payableId);
      await axios.put(
        `http://37.148.210.169:5001/api/payables/${payableId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Refresh payables list
      fetchPayables();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setStatusLoading(null);
    }
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
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payable?')) {
      try {
        await axios.delete(`http://37.148.210.169:5001/api/payables/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchPayables();
      } catch (error) {
        console.error('Error deleting payable:', error);
        alert('Failed to delete payable');
      }
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = payables.map(payable => ({
      'Supplier Name': payable.supplierName,
      'Invoice Number': payable.invoiceNumber,
      'Amount Owed': `$${payable.amountOwed}`,
      'Due Date': new Date(payable.dueDate).toLocaleDateString(),
      'Status': payable.status
    }));

    const worksheet = XLSXUtils.json_to_sheet(exportData);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Payables');
    XLSXWriteFile(workbook, 'payables_report.xlsx');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Payables Report', 10, 10);
    
    let yPos = 30;
    payables.forEach((payable) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.text(`Supplier: ${payable.supplierName}`, 10, yPos);
      doc.text(`Invoice: ${payable.invoiceNumber}`, 10, yPos + 7);
      doc.text(`Amount: $${payable.amountOwed}`, 10, yPos + 14);
      doc.text(`Due Date: ${new Date(payable.dueDate).toLocaleDateString()}`, 10, yPos + 21);
      doc.text(`Status: ${payable.status}`, 10, yPos + 28);
      
      yPos += 40;
    });

    doc.save('payables_report.pdf');
  };

  return (
    <div className="payables-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="payables-container">
          <h1>{t('Payables')}</h1>

          {/* Search and Export */}
          <div className="payables-actions">
            <input
              type="text"
              placeholder={t('Search payables...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={exportToExcel} className="export-btn">
              <i className="fas fa-file-excel"></i> {t('Export Excel')}
            </button>
            <button onClick={exportToPDF} className="export-btn">
              <i className="fas fa-file-pdf"></i> {t('Export PDF')}
            </button>
          </div>

          {/* Add/Edit Payable Form */}
          {userRole === 'admin' && (
            <form className="payables-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="supplierName"
                placeholder={t('Supplier Name')}
                value={formData.supplierName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="invoiceNumber"
                placeholder={t('Invoice Number')}
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="amountOwed"
                placeholder={t('Amount Owed')}
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
              <button type="submit" className="submit-btn">
                {selectedPayable ? t('Update Payable') : t('Add Payable')}
              </button>
            </form>
          )}

          {/* Payables List */}
          {loading ? (
            <div className="loading">{t('Loading...')}</div>
          ) : (
            <table className="payables-table">
              <thead>
                <tr>
                  <th>{t('Supplier Name')}</th>
                  <th>{t('Invoice Number')}</th>
                  <th>{t('Amount Owed')}</th>
                  <th>{t('Due Date')}</th>
                  <th>{t('Status')}</th>
                  {userRole === 'admin' && <th>{t('Actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {payables
                  .filter(payable =>
                    payable.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    payable.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((payable) => (
                    <tr key={payable.id}>
                      <td>{payable.supplierName}</td>
                      <td>{payable.invoiceNumber}</td>
                      <td>${payable.amountOwed}</td>
                      <td>{new Date(payable.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${payable.status.toLowerCase()}`}>
                          {payable.status}
                        </span>
                      </td>
                      {userRole === 'admin' && (
                        <td className="action-buttons">
                          <select
                            value={payable.status}
                            onChange={(e) => handleStatusChange(payable.id, e.target.value)}
                            disabled={statusLoading === payable.id}
                            className="status-select"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Paid">Paid</option>
                          </select>
                          <button onClick={() => handleEdit(payable)} className="edit-btn">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button onClick={() => handleDelete(payable.id)} className="delete-btn">
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payables;
