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

      const processedData = processReportData(reportType, data, range);
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

  const processReportData = (type, data, range) => {
    // For customers, we don't need to filter by date range
    if (type === 'customers') {
      return processCustomerData(data);
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

  const processCustomerData = (data) => {
    console.log('Processing customer data:', data);

    // Filter out admin users and group customers by role
    const filteredCustomers = data.filter(customer => 
      customer.role?.toLowerCase() === 'user'
    );
    
    console.log('Filtered customers (users only):', filteredCustomers);

    // Group customers by some meaningful attribute (e.g., has phone number or not)
    const customerGroups = {
      'Active Users': filteredCustomers.filter(c => c.phone).length,
      'Incomplete Profile': filteredCustomers.filter(c => !c.phone).length
    };

    console.log('Customer groups:', customerGroups);

    const chartData = {
      labels: Object.keys(customerGroups),
      datasets: [{
        data: Object.values(customerGroups),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
        ],
      }]
    };

    // Calculate new customers (registered in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const summary = {
      totalCustomers: filteredCustomers.length,
      activeCustomers: filteredCustomers.filter(c => c.phone).length,
      newCustomers: filteredCustomers.length // Since we don't have creation date, show total for now
    };

    return {
      chartData,
      summary
    };
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
    if (!currentData) return null;

    return (
      <Card className="mt-4">
        <Card.Body>
          <h4>{reportCards.find(card => card.type === activeReport)?.title}</h4>
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

          <Row className="mb-4">
            {Object.entries(currentData.summary).map(([key, value]) => (
              <Col md={4} key={key}>
                <Card className="summary-card">
                  <Card.Body>
                    <Card.Title>{key.replace(/([A-Z])/g, ' $1').trim()}</Card.Title>
                    <Card.Text>{typeof value === 'number' ? value.toFixed(2) : value}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="chart-container">
            {activeReport === 'sales' && <Line data={currentData.chartData} />}
            {activeReport === 'customers' && <Pie data={currentData.chartData} />}
            {activeReport === 'inventory' && <Bar data={currentData.chartData} />}
            {activeReport === 'orders' && <Pie data={currentData.chartData} />}
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