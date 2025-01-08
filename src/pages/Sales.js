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

const Sales = () => {
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

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/orders', {
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
          label: 'Orders by Status',
          data: Object.values(statusCount),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1
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

  return (
    <div className="sales-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="sales-container">
          <h1>Sales Dashboard</h1>

          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <div className="loading">Loading sales data...</div>
          ) : (
            <>
              {/* Sales Metrics Cards */}
              <div className="metrics-container">
                <div className="metric-card">
                  <h3>Total Sales</h3>
                  <p>${salesMetrics.totalSales.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <h3>Total Orders</h3>
                  <p>{salesMetrics.totalOrders}</p>
                </div>
                <div className="metric-card">
                  <h3>Average Order Value</h3>
                  <p>${salesMetrics.averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <h3>Pending Orders</h3>
                  <p>{salesMetrics.pendingOrders}</p>
                </div>
                <div className="metric-card">
                  <h3>Completed Orders</h3>
                  <p>{salesMetrics.completedOrders}</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="charts-container">
                <div className="chart-card">
                  <h3>Daily Sales Trend</h3>
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

                <div className="chart-card">
                  <h3>Orders by Status</h3>
                  <div className="chart-wrapper">
                    <Pie 
                      data={chartData.ordersByStatus}
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

                <div className="chart-card">
                  <h3>Product Performance</h3>
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
                <button onClick={exportAsExcel}>Export as Excel</button>
                <button onClick={exportAsPDF}>Export as PDF</button>
              </div>

              {/* Orders by Status */}
              {['Pending', 'Approved', 'On Process', 'Completed'].map(status => (
                <div key={status} className="order-section">
                  <h2>{status} Orders</h2>
                  <table className="sales-table">
                    <thead>
                      <tr>
                        <th>Order Date</th>
                        <th>Customer Name</th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterOrdersByStatus(status).map((sale) => (
                        <tr key={sale.id}>
                          <td>{sale.orderDate}</td>
                          <td>{sale.customerName}</td>
                          <td>{sale.productName}</td>
                          <td>{sale.quantity}</td>
                          <td>${sale.price}</td>
                          <td>${sale.total}</td>
                        </tr>
                      ))}
                      {filterOrdersByStatus(status).length === 0 && (
                        <tr>
                          <td colSpan="6" className="no-orders">No {status.toLowerCase()} orders</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
