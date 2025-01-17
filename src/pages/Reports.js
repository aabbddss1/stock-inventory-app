import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faWarehouse, faFileAlt, faFileExcel } from '@fortawesome/free-solid-svg-icons';
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
import '../styles/Reports.css';
import { useTranslation } from 'react-i18next';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx';

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

function Reports() {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('7days');
  const [reportData, setReportData] = useState({
    sales: null,
    customers: null,
    inventory: null,
    orders: null
  });

  const reportCards = [
    {
      title: 'Sales Reports',
      icon: faChartLine,
      type: 'sales',
      description: 'View detailed sales analytics and trends'
    },
    {
      title: 'Customer Reports',
      icon: faUsers,
      type: 'customers',
      description: 'Analyze customer behavior and demographics'
    },
    {
      title: 'Inventory Reports',
      icon: faWarehouse,
      type: 'inventory',
      description: 'Track inventory levels and movements'
    },
    {
      title: 'Order Reports',
      icon: faFileAlt,
      type: 'orders',
      description: 'Monitor order status and history'
    }
  ];

  useEffect(() => {
    fetchReportData(activeReport, dateRange);
  }, [activeReport, dateRange]);

  const fetchReportData = async (reportType, range) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      let endpoint = '';
      switch (reportType) {
        case 'sales':
          endpoint = 'http://37.148.210.169:5001/api/orders';
          break;
        case 'customers':
          endpoint = 'http://37.148.210.169:5001/api/customers';
          break;
        case 'inventory':
          endpoint = 'http://37.148.210.169:5001/api/inventory';
          break;
        case 'orders':
          endpoint = 'http://37.148.210.169:5001/api/orders';
          break;
        default:
          throw new Error('Invalid report type');
      }

      console.log(`Fetching ${reportType} data from:`, endpoint);

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`${reportType} response status:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response:`, errorText);
        throw new Error(`Failed to fetch ${reportType} data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`${reportType} data received:`, data);

      const processedData = await processReportData(reportType, data, range);
      console.log(`${reportType} processed data:`, processedData);

      setReportData(prev => ({
        ...prev,
        [reportType]: processedData
      }));
    } catch (err) {
      console.error(`Error fetching ${reportType} data:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = async (type, data, range) => {
    // For customers, we don't need to filter by date range
    if (type === 'customers') {
      return await processCustomerData(data);
    }

    const now = new Date();
    const rangeDate = new Date();
    
    switch (range) {
      case '7days':
        rangeDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        rangeDate.setDate(now.getDate() - 30);
        break;
      default:
        rangeDate.setDate(now.getDate() - 7);
    }

    // Only filter by date for orders, sales, and inventory
    const filteredData = data.filter(item => {
      const itemDate = new Date(item.createdAt || item.orderDate);
      return itemDate >= rangeDate;
    });

    switch (type) {
      case 'sales':
        return processSalesData(filteredData);
      case 'inventory':
        return processInventoryData(data); // Don't filter inventory by date
      case 'orders':
        return processOrderData(filteredData);
      default:
        return filteredData;
    }
  };

  const processSalesData = (data) => {
    const salesByDate = data.reduce((acc, order) => {
      const date = new Date(order.orderDate).toLocaleDateString();
      acc[date] = (acc[date] || 0) + (order.price * order.quantity);
      return acc;
    }, {});

    return {
      chartData: {
        labels: Object.keys(salesByDate),
        datasets: [{
          label: 'Daily Sales',
          data: Object.values(salesByDate),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      summary: {
        totalSales: data.reduce((sum, order) => sum + (order.price * order.quantity), 0),
        averageOrderValue: data.length > 0 ? 
          data.reduce((sum, order) => sum + (order.price * order.quantity), 0) / data.length : 0,
        totalOrders: data.length
      }
    };
  };

  const processCustomerData = async (customerData) => {
    console.log('Processing customer data:', customerData);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://37.148.210.169:5001/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders data');
      }

      const ordersData = await response.json();
      console.log('Orders data for customer analysis:', ordersData);

      // Filter out admin users
      const filteredCustomers = customerData.filter(customer => 
        customer.role?.toLowerCase() === 'user'
      );
      
      // Process detailed customer analytics
      const customerAnalytics = filteredCustomers.map(customer => {
        const customerOrders = ordersData.filter(order => 
          order.clientEmail === customer.email
        );

        // Calculate total spending
        const totalSpent = customerOrders.reduce((sum, order) => 
          sum + (order.price * order.quantity), 0
        );

        // Calculate product frequency
        const productFrequency = customerOrders.reduce((acc, order) => {
          acc[order.productName] = (acc[order.productName] || 0) + order.quantity;
          return acc;
        }, {});

        // Get most purchased product
        const mostPurchasedProduct = Object.entries(productFrequency)
          .sort(([,a], [,b]) => b - a)[0] || ['None', 0];

        // Calculate average order value
        const averageOrderValue = customerOrders.length > 0 
          ? totalSpent / customerOrders.length 
          : 0;

        // Calculate order frequency (orders per month)
        const orderDates = customerOrders.map(order => new Date(order.orderDate));
        const orderFrequency = orderDates.length > 0 
          ? (() => {
              const firstOrder = Math.min(...orderDates);
              const lastOrder = Math.max(...orderDates);
              const monthsDiff = (lastOrder - firstOrder) / (1000 * 60 * 60 * 24 * 30);
              // If less than a month between first and last order, calculate based on current month
              if (monthsDiff < 1) {
                const today = new Date();
                const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return orderDates.filter(date => date >= thisMonth).length;
              }
              return (orderDates.length / monthsDiff) || 0;
            })()
          : 0;

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || 'Not provided',
          totalOrders: customerOrders.length,
          totalSpent: totalSpent,
          averageOrderValue: averageOrderValue,
          orderFrequency: orderFrequency,
          mostPurchasedProduct: mostPurchasedProduct[0],
          mostPurchasedQuantity: mostPurchasedProduct[1],
          lastOrderDate: customerOrders.length > 0 
            ? new Date(Math.max(...orderDates)).toLocaleDateString()
            : 'No orders',
          productFrequency: productFrequency
        };
      });

      // Sort customers by total spent
      customerAnalytics.sort((a, b) => b.totalSpent - a.totalSpent);

      // 1. Customer Spending Distribution
      const spendingRanges = {
        '$0-$100': 0,
        '$101-$500': 0,
        '$501-$1000': 0,
        '$1000+': 0
      };

      customerAnalytics.forEach(customer => {
        if (customer.totalSpent <= 100) spendingRanges['$0-$100']++;
        else if (customer.totalSpent <= 500) spendingRanges['$101-$500']++;
        else if (customer.totalSpent <= 1000) spendingRanges['$501-$1000']++;
        else spendingRanges['$1000+']++;
      });

      // 2. Order Frequency Distribution
      const orderFrequencyData = {
        labels: customerAnalytics.slice(0, 10).map(c => c.name),
        datasets: [{
          label: 'Orders per Month',
          data: customerAnalytics.slice(0, 10).map(c => 
            typeof c.orderFrequency === 'number' && isFinite(c.orderFrequency) 
              ? Number(c.orderFrequency.toFixed(1)) 
              : 0
          ),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      };

      // 3. Top Products Analysis
      const allProducts = {};
      customerAnalytics.forEach(customer => {
        Object.entries(customer.productFrequency).forEach(([product, quantity]) => {
          allProducts[product] = (allProducts[product] || 0) + quantity;
        });
      });

      const topProducts = Object.entries(allProducts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      const topProductsData = {
        labels: topProducts.map(([product]) => product),
        datasets: [{
          label: 'Total Purchases',
          data: topProducts.map(([,quantity]) => quantity),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      };

      // 4. Customer Lifetime Value Distribution
      const sortedByValue = [...customerAnalytics].sort((a, b) => a.totalSpent - b.totalSpent);
      const lifetimeValueData = {
        labels: sortedByValue.map(c => c.name),
        datasets: [{
          label: 'Customer Lifetime Value',
          data: sortedByValue.map(c => c.totalSpent),
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          fill: false
        }]
      };

      // Calculate summary metrics
      const summary = {
        totalCustomers: filteredCustomers.length,
        activeCustomers: customerAnalytics.filter(c => c.totalOrders > 0).length,
        averageCustomerSpend: customerAnalytics.reduce((sum, c) => sum + c.totalSpent, 0) / filteredCustomers.length,
        totalRevenue: customerAnalytics.reduce((sum, c) => sum + c.totalSpent, 0),
        averageOrderFrequency: customerAnalytics.reduce((sum, c) => sum + c.orderFrequency, 0) / customerAnalytics.length
      };

      return {
        chartData: {
          spending: {
            labels: Object.keys(spendingRanges),
            datasets: [{
              data: Object.values(spendingRanges),
              backgroundColor: [
                'rgba(54, 162, 235, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(255, 99, 132, 0.5)',
              ],
            }]
          },
          orderFrequency: orderFrequencyData,
          topProducts: topProductsData,
          lifetimeValue: lifetimeValueData
        },
        summary,
        customerAnalytics
      };
    } catch (error) {
      console.error('Error processing customer data:', error);
      throw error;
    }
  };

  const processInventoryData = (data) => {
    // Sort inventory items by quantity (ascending) and take top 10 lowest stock items
    const sortedItems = [...data]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    const stockLevels = {};
    sortedItems.forEach(item => {
      stockLevels[item.name] = parseInt(item.quantity);
    });

    // Count items by status
    const statusCounts = data.reduce((acc, item) => {
      const status = getInventoryStatus(item.quantity);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      chartData: {
        labels: Object.keys(stockLevels),
        datasets: [{
          label: 'Stock Levels',
          data: Object.values(stockLevels),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      summary: {
        totalItems: data.length,
        lowStock: statusCounts['Low Stock'] || 0,
        outOfStock: statusCounts['Out of Stock'] || 0
      }
    };
  };

  // Helper function to determine inventory status
  const getInventoryStatus = (quantity) => {
    quantity = parseInt(quantity);
    if (quantity <= 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    return 'In Stock';
  };

  const processOrderData = (data) => {
    const ordersByStatus = data.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return {
      chartData: {
        labels: Object.keys(ordersByStatus),
        datasets: [{
          data: Object.values(ordersByStatus),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
          ],
        }]
      },
      summary: {
        totalOrders: data.length,
        pendingOrders: data.filter(order => order.status === 'Pending').length,
        completedOrders: data.filter(order => order.status === 'Completed').length
      }
    };
  };

  const exportCustomerAnalytics = (customerData) => {
    // Prepare data for export
    const exportData = customerData.map(customer => ({
      'Customer Name': customer.name,
      'Email': customer.email,
      'Phone': customer.phone,
      'Total Orders': customer.totalOrders,
      'Total Spent': `$${customer.totalSpent.toFixed(2)}`,
      'Average Order Value': `$${customer.averageOrderValue.toFixed(2)}`,
      'Orders per Month': customer.orderFrequency.toFixed(1),
      'Most Purchased Product': `${customer.mostPurchasedProduct} (${customer.mostPurchasedQuantity})`,
      'Last Order': customer.lastOrderDate
    }));

    const worksheet = XLSXUtils.json_to_sheet(exportData);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Customer Analytics');
    XLSXWriteFile(workbook, 'customer_analytics.xlsx');
  };

  const renderReportContent = () => {
    if (loading) {
      return null; // Return nothing during loading since it's fast
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    const currentData = reportData[activeReport];
    if (!currentData) {
      return <div className="error-message">No data available for this report type.</div>;
    }

    // Add null check for summary
    if (!currentData.summary) {
      console.error('Summary data is missing for', activeReport);
      return <div className="error-message">Unable to load report summary.</div>;
    }

    return (
      <Card className="mt-4">
        <Card.Body>
          <h4>{reportCards.find(card => card.type === activeReport)?.title}</h4>
          
          {/* Date range filters - only show for non-customer reports */}
          {activeReport !== 'customers' && (
            <div className="report-filters mb-3">
              <Button 
                variant={dateRange === '7days' ? 'primary' : 'outline-primary'} 
                className="me-2"
                onClick={() => setDateRange('7days')}
              >
                Last 7 Days
              </Button>
              <Button 
                variant={dateRange === '30days' ? 'primary' : 'outline-primary'} 
                className="me-2"
                onClick={() => setDateRange('30days')}
              >
                Last 30 Days
              </Button>
            </div>
          )}

          <Row className="mb-4">
            {Object.entries(currentData.summary || {}).map(([key, value]) => (
              <Col md={4} key={key}>
                <Card className="summary-card">
                  <Card.Body>
                    <Card.Title>{key.replace(/([A-Z])/g, ' $1').trim()}</Card.Title>
                    <Card.Text>
                      {typeof value === 'number' ? 
                        key.toLowerCase().includes('spend') ? 
                          `$${value.toFixed(2)}` : 
                          key === 'totalSales' ? 
                            `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".").replace('.', ',')} $` : 
                            Math.floor(value)
                        : value || 'N/A'}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="chart-container">
            {activeReport === 'sales' && currentData.chartData && <Line data={currentData.chartData} />}
            {activeReport === 'customers' && currentData.chartData && (
              <>
                <Row className="mb-4">
                  <Col md={6}>
                    <Card>
                      <Card.Body>
                        <h5 className="mb-3">Customer Spending Distribution</h5>
                        <div style={{ height: '300px', position: 'relative' }}>
                          <Pie 
                            data={currentData.chartData.spending}
                            options={{
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom'
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <Card.Body>
                        <h5 className="mb-3">Top 10 Customer Order Frequency</h5>
                        <div style={{ height: '300px', position: 'relative' }}>
                          <Bar 
                            data={currentData.chartData.orderFrequency}
                            options={{
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom'
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <Row className="mb-4">
                  <Col md={6}>
                    <Card>
                      <Card.Body>
                        <h5 className="mb-3">Top 5 Products by Customer Purchases</h5>
                        <div style={{ height: '300px', position: 'relative' }}>
                          <Bar 
                            data={currentData.chartData.topProducts}
                            options={{
                              maintainAspectRatio: false,
                              indexAxis: 'y',
                              plugins: {
                                legend: {
                                  display: false
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <Card.Body>
                        <h5 className="mb-3">Customer Lifetime Value Distribution</h5>
                        <div style={{ height: '300px', position: 'relative' }}>
                          <Line 
                            data={currentData.chartData.lifetimeValue}
                            options={{
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true
                                }
                              }
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                
                {currentData.customerAnalytics && currentData.customerAnalytics.length > 0 ? (
                  <div className="customer-details mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Detailed Customer Analytics</h5>
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => exportCustomerAnalytics(currentData.customerAnalytics)}
                        className="export-button"
                      >
                        <FontAwesomeIcon icon={faFileExcel} className="me-2" />
                        Export to Excel
                      </Button>
                    </div>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Customer Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Total Orders</th>
                            <th>Total Spent</th>
                            <th>Avg. Order Value</th>
                            <th>Orders/Month</th>
                            <th>Most Purchased</th>
                            <th>Last Order</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.customerAnalytics.map(customer => (
                            <tr key={customer.id}>
                              <td>{customer.name}</td>
                              <td>{customer.email}</td>
                              <td>{customer.phone}</td>
                              <td>{customer.totalOrders}</td>
                              <td>${customer.totalSpent.toFixed(2)}</td>
                              <td>${customer.averageOrderValue.toFixed(2)}</td>
                              <td>{customer.orderFrequency.toFixed(1)}</td>
                              <td>{customer.mostPurchasedProduct} ({customer.mostPurchasedQuantity})</td>
                              <td>{customer.lastOrderDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-center">
                    <p>No customer analytics data available.</p>
                  </div>
                )}
              </>
            )}
            {activeReport === 'inventory' && currentData.chartData && <Bar data={currentData.chartData} />}
            {activeReport === 'orders' && currentData.chartData && (
              <div className="orders-chart-container">
                <Pie 
                  data={currentData.chartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="reports-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="reports-container">
          <h1 className="page-title">Reports Dashboard</h1>
          
          <Row className="report-cards">
            {reportCards.map((card, index) => (
              <Col md={3} key={index}>
                <Card 
                  className={`report-card ${activeReport === card.type ? 'active' : ''}`}
                  onClick={() => setActiveReport(card.type)}
                >
                  <Card.Body>
                    <div className="report-card-icon">
                      <FontAwesomeIcon icon={card.icon} />
                    </div>
                    <Card.Title>{card.title}</Card.Title>
                    <Card.Text>{card.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
}

export default Reports; 