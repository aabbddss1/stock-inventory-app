// src/pages/Receivables.js
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import jsPDF from 'jspdf'; // For PDF export
import axios from 'axios';
import '../styles/Receivables.css';
import { useTranslation } from 'react-i18next';

const Receivables = () => {
  const { t } = useTranslation();
  const [completedOrders, setCompletedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(null);

  const token = localStorage.getItem('token');
  const userData = JSON.parse(atob(token.split('.')[1]));
  const userRole = userData.role;

  // Fetch completed orders
  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://37.148.210.169:5001/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter only completed orders and add payment status if not exists
        const completed = response.data
          .filter(order => order.status === 'Completed')
          .map(order => ({
            ...order,
            paymentStatus: order.paymentStatus || 'Pending' // Default to 'Pending' if not set
          }));
        
        setCompletedOrders(completed);
      } catch (error) {
        console.error('Error fetching completed orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedOrders();
  }, [token]);

  // Handle payment status change
  const handlePaymentStatusChange = async (orderId, newStatus) => {
    try {
      setStatusLoading(orderId);
      
      // Update payment status in the backend
      await axios.put(
        `http://37.148.210.169:5001/api/orders/${orderId}/payment-status`,
        { paymentStatus: newStatus },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state
      setCompletedOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, paymentStatus: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    } finally {
      setStatusLoading(null);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = completedOrders.map(order => ({
      'Order ID': order.id,
      'Client Name': order.clientName,
      'Product Name': order.productName,
      'Amount': `$${order.price * order.quantity}`,
      'Order Date': new Date(order.orderDate).toLocaleDateString(),
      'Payment Status': order.paymentStatus
    }));

    const worksheet = XLSXUtils.json_to_sheet(exportData);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Receivables');
    XLSXWriteFile(workbook, 'receivables_report.xlsx');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Receivables Report', 10, 10);
    
    let yPos = 30;
    completedOrders.forEach((order, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.text(`Order #${order.id}`, 10, yPos);
      doc.text(`Client: ${order.clientName}`, 10, yPos + 7);
      doc.text(`Amount: $${order.price * order.quantity}`, 10, yPos + 14);
      doc.text(`Status: ${order.paymentStatus}`, 10, yPos + 21);
      
      yPos += 35;
    });

    doc.save('receivables_report.pdf');
  };

  // Filter orders based on search term
  const filteredOrders = completedOrders.filter(order =>
    order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.paymentStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="receivables-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="receivables-container">
          <h1>{t('Receivables')}</h1>

          <div className="receivables-actions">
            <input
              type="text"
              placeholder={t('Search receivables...')}
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

          {loading ? (
            <div className="loading">{t('Loading...')}</div>
          ) : (
            <table className="receivables-table">
              <thead>
                <tr>
                  <th>{t('Order ID')}</th>
                  <th>{t('Client Name')}</th>
                  <th>{t('Product')}</th>
                  <th>{t('Amount')}</th>
                  <th>{t('Order Date')}</th>
                  <th>{t('Payment Status')}</th>
                  {userRole === 'admin' && <th>{t('Actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.clientName}</td>
                    <td>{order.productName}</td>
                    <td>${order.price * order.quantity}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${order.paymentStatus.toLowerCase()}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    {userRole === 'admin' && (
                      <td>
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                          disabled={statusLoading === order.id}
                          className="status-select"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Received">Received</option>
                        </select>
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

export default Receivables;
