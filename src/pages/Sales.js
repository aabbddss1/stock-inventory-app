// src/pages/Sales.js
import React, { useState, useEffect } from 'react';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import jsPDF from 'jspdf'; // For PDF export
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import '../styles/Sales.css';
import { useTranslation } from 'react-i18next';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Add this color configuration near the top of the file
const statusColors = {
  backgroundColor: [
    'rgba(54, 162, 235, 0.8)',   // Blue
    'rgba(75, 192, 192, 0.8)',   // Teal
    'rgba(255, 206, 86, 0.8)',   // Yellow
    'rgba(255, 99, 132, 0.8)'    // Red
  ],
  borderColor: [
    'rgba(54, 162, 235, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(255, 99, 132, 1)'
  ]
};

const Sales = () => {
  const { t } = useTranslation();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesMetrics, setSalesMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [chartData, setChartData] = useState({
    dailySales: {},
    ordersByStatus: {},
    productPerformance: {},
  });
  const [expandedSections, setExpandedSections] = useState({
    Pending: true,    // Start with Pending orders visible
    Approved: false,
    'On Process': false,
    Completed: false
  });

  // Sıralama durumları
  const [sortOrderDate, setSortOrderDate] = useState('asc');
  const [sortOrderQuantity, setSortOrderQuantity] = useState('asc');
  const [sortOrderPrice, setSortOrderPrice] = useState('asc');
  const [sortOrderTotal, setSortOrderTotal] = useState('asc');

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://37.148.210.169:5001/api/orders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }

        const data = JSON.parse(responseText);
        
        const transformedSales = data.map(order => ({
          id: order.id,
          customerName: order.clientName,
          productName: order.productName,
          quantity: order.quantity,
          price: order.price,
          total: order.quantity * order.price,
          status: order.status,
          orderDate: new Date(order.orderDate).toLocaleDateString()
        }));
        
        setSales(transformedSales);
        calculateSalesMetrics(transformedSales);
        calculateChartData(transformedSales);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(`Error fetching orders: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Sıralama fonksiyonları
  const toggleSortOrderDate = () => {
    const newOrder = sortOrderDate === 'asc' ? 'desc' : 'asc';
    setSortOrderDate(newOrder);
    const sorted = [...sales].sort((a, b) => {
      return newOrder === 'asc' ? new Date(a.orderDate) - new Date(b.orderDate) : new Date(b.orderDate) - new Date(a.orderDate);
    });
    setSales(sorted);
  };

  const toggleSortOrderQuantity = () => {
    const newOrder = sortOrderQuantity === 'asc' ? 'desc' : 'asc';
    setSortOrderQuantity(newOrder);
    const sorted = [...sales].sort((a, b) => {
      return newOrder === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
    });
    setSales(sorted);
  };

  const toggleSortOrderPrice = () => {
    const newOrder = sortOrderPrice === 'asc' ? 'desc' : 'asc';
    setSortOrderPrice(newOrder);
    const sorted = [...sales].sort((a, b) => {
      return newOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });
    setSales(sorted);
  };

  const toggleSortOrderTotal = () => {
    const newOrder = sortOrderTotal === 'asc' ? 'desc' : 'asc';
    setSortOrderTotal(newOrder);
    const sorted = [...sales].sort((a, b) => {
      return newOrder === 'asc' ? a.total - b.total : b.total - a.total;
    });
    setSales(sorted);
  };

  const calculateSalesMetrics = (salesData) => {
    const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
    const totalOrders = salesData.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const pendingOrders = salesData.filter(sale => sale.status === 'Pending').length;
    const completedOrders = salesData.filter(sale => sale.status === 'Completed').length;

    setSalesMetrics({
      totalSales,
      totalOrders,
      averageOrderValue,
      pendingOrders,
      completedOrders,
    });
  };

  const filterOrdersByStatus = (status) => {
    return sales.filter(sale => sale.status === status);
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

  const calculateChartData = (salesData) => {
    // Daily sales data
    const salesByDate = salesData.reduce((acc, sale) => {
      const date = sale.orderDate;
      acc[date] = (acc[date] || 0) + sale.total;
      return acc;
    }, {});

    // Orders by status
    const statusCount = salesData.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {});

    // Product performance
    const productSales = salesData.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + sale.total;
      return acc;
    }, {});

    setChartData({
      dailySales: {
        labels: Object.keys(salesByDate),
        datasets: [{
          label: 'Daily Sales',
          data: Object.values(salesByDate),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      ordersByStatus: {
        labels: Object.keys(statusCount),
        datasets: [{
          data: Object.values(statusCount),
          backgroundColor: statusColors.backgroundColor,
          borderColor: statusColors.borderColor,
          borderWidth: 1,
          hoverOffset: 4
        }]
      },
      productPerformance: {
        labels: Object.keys(productSales),
        datasets: [{
          label: 'Product Sales',
          data: Object.values(productSales),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      }
    });
  };

  const toggleSection = (status) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  return (
    <div className="sales-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="sales-container">
          <h1>{t('salesDashboard')}</h1>

          {error && <div className="error-message">{t('errorFetching', { message: error })}</div>}
          {loading ? (
            <div className="loading">{t('loading')}</div>
          ) : (
            <>
              {/* Metrics Cards */}
              <div className="metrics-container">
                <div className="metric-card">
                  <h3>{t('totalSales')}</h3>
                  <p>{t('currency')}{salesMetrics.totalSales.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <h3>{t('totalOrders')}</h3>
                  <p>{salesMetrics.totalOrders}</p>
                </div>
                <div className="metric-card">
                  <h3>{t('averageOrderValue')}</h3>
                  <p>{t('currency')}{salesMetrics.averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <h3>{t('pendingOrders')}</h3>
                  <p>{salesMetrics.pendingOrders}</p>
                </div>
                <div className="metric-card">
                  <h3>{t('completedOrders')}</h3>
                  <p>{salesMetrics.completedOrders}</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="charts-container">
                <div className="chart-card">
                  <h3>{t('dailySalesTrend')}</h3>
                  <div className="chart-wrapper">
                    <Line 
                      data={chartData.dailySales}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: false }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="chart-card pie-chart-card">
                  <h3>{t('ordersByStatus')}</h3>
                  <div className="chart-wrapper">
                    <Pie 
                      data={chartData.ordersByStatus}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              usePointStyle: true,
                              padding: 20,
                              font: {
                                size: 11
                              }
                            }
                          },
                          title: { 
                            display: false 
                          }
                        },
                        layout: {
                          padding: 10
                        },
                        elements: {
                          arc: {
                            borderWidth: 1,
                            borderColor: '#fff'
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="chart-card">
                  <h3>{t('productPerformance')}</h3>
                  <div className="chart-wrapper">
                    <Bar 
                      data={chartData.productPerformance}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: false }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="sales-actions">
                <button onClick={exportAsExcel}>
                  <i className="fa fa-file-excel"></i> {t('exportAsExcel')}
                </button>
                <button onClick={exportAsPDF}>{t('exportAsPDF')}</button>
              </div>

              {/* Orders by Status */}
              {['Pending', 'Approved', 'On Process', 'Completed'].map(status => (
                <div key={status} className="order-section">
                  <div 
                    className="order-section-header" 
                    onClick={() => toggleSection(status)}
                  >
                    <div className="header-content">
                      <h2>{t(`${status.toLowerCase().replace(' ', '')}OrdersTitle`)}</h2>
                      <span className="order-count">
                        {filterOrdersByStatus(status).length} {t('orders')}
                      </span>
                    </div>
                    <i className={`fas fa-chevron-${expandedSections[status] ? 'up' : 'down'}`} />
                  </div>
                  
                  <div className={`order-section-content ${expandedSections[status] ? 'expanded' : ''}`}>
                    <table className="sales-table">
                      <thead>
                        <tr>
                          <th onClick={toggleSortOrderDate} style={{ cursor: 'pointer' }}>
                            {t('orderDate')} {sortOrderDate === 'asc' ? '▲' : '▼'}
                          </th>
                          <th onClick={toggleSortOrderQuantity} style={{ cursor: 'pointer' }}>
                            {t('quantity')} {sortOrderQuantity === 'asc' ? '▲' : '▼'}
                          </th>
                          <th onClick={toggleSortOrderPrice} style={{ cursor: 'pointer' }}>
                            {t('price')} {sortOrderPrice === 'asc' ? '▲' : '▼'}
                          </th>
                          <th onClick={toggleSortOrderTotal} style={{ cursor: 'pointer' }}>
                            {t('total')} {sortOrderTotal === 'asc' ? '▲' : '▼'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterOrdersByStatus(status).map((sale) => (
                          <tr key={sale.id}>
                            <td>{sale.orderDate}</td>
                            <td>{sale.quantity}</td>
                            <td>{t('currency')}{sale.price}</td>
                            <td>{t('currency')}{sale.total}</td>
                          </tr>
                        ))}
                        {filterOrdersByStatus(status).length === 0 && (
                          <tr>
                            <td colSpan="4" className="no-orders">
                              {t('noOrders', { status: t(status.toLowerCase()) })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales;
