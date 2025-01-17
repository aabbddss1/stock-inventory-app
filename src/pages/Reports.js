import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faWarehouse, faFileAlt } from '@fortawesome/free-solid-svg-icons';
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

    // Fetch orders data for customer analysis
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

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || 'Not provided',
          totalOrders: customerOrders.length,
          totalSpent: totalSpent,
          averageOrderValue: averageOrderValue,
          mostPurchasedProduct: mostPurchasedProduct[0],
          mostPurchasedQuantity: mostPurchasedProduct[1],
          lastOrderDate: customerOrders.length > 0 
            ? new Date(Math.max(...customerOrders.map(o => new Date(o.orderDate)))).toLocaleDateString()
            : 'No orders'
        };
      });

      // Sort customers by total spent
      customerAnalytics.sort((a, b) => b.totalSpent - a.totalSpent);

      // Prepare chart data for customer spending distribution
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

      const chartData = {
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
      };

      // Calculate summary metrics
      const summary = {
        totalCustomers: filteredCustomers.length,
        activeCustomers: customerAnalytics.filter(c => c.totalOrders > 0).length,
        averageCustomerSpend: customerAnalytics.reduce((sum, c) => sum + c.totalSpent, 0) / filteredCustomers.length
      };

      return {
        chartData,
        summary,
        customerAnalytics // Include detailed customer data
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

  const renderReportContent = () => {
    if (loading) {
      return <div className="loading-spinner">Loading...</div>;
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
                          value.toFixed(2) 
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
                <h5 className="mb-3">Customer Spending Distribution</h5>
                <Pie data={currentData.chartData} />
                
                {currentData.customerAnalytics && currentData.customerAnalytics.length > 0 ? (
                  <div className="customer-details mt-4">
                    <h5 className="mb-3">Detailed Customer Analytics</h5>
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
            {activeReport === 'orders' && currentData.chartData && <Pie data={currentData.chartData} />}
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