import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faTruck, 
  faShoppingCart, 
  faClipboardList, 
  faWarehouse, 
  faEnvelope, 
  faBell, 
  faListCheck, 
  faListAlt, 
  faPlus, 
  faSync, 
  faUsers,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import AddCustomer from '../pages/AddCustomer';
import AddSupplier from '../pages/AddSupplier';
import axios from 'axios'; // Axios for API calls
import '../styles/DashboardCards.css';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  Legend
} from 'chart.js';
import { useTranslation } from 'react-i18next';
import { dashboardTranslations } from '../i18n/dashboardTranslations';

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

function DashboardCards() {
  const { t, i18n } = useTranslation();
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [isQuickOrderModalOpen, setIsQuickOrderModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isPendingOrdersModalOpen, setIsPendingOrdersModalOpen] = useState(false);

  const [newOrder, setNewOrder] = useState({
    clientEmail: '',
    productName: '',
    quantity: '',
    price: ''
  });

  const [users, setUsers] = useState([]); // List of users
  const [inventory, setInventory] = useState([]); // List of inventory products
  const [actionLoading, setActionLoading] = useState(false);

  // Dynamic data for dashboard cards
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [notifications, setNotifications] = useState([]); // Initialize as empty array
  const [pendingOrdersList, setPendingOrdersList] = useState([]);

  // Add new states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [orders, setOrders] = useState([]); // Add this state if you haven't already

  // Add new states for analytics
  const [analytics, setAnalytics] = useState({
    dailySales: [],
    weeklySales: [],
    salesByStatus: [],
    inventoryLevels: []
  });

  // Add new state for user
  const [user, setUser] = useState(null);

  // Add this to your state declarations at the top of the component
  const [dailyOrderCount, setDailyOrderCount] = useState(0);

  // Add these lines to get user data and token
  const token = localStorage.getItem('token');
  const userRole = user?.role;
  const userEmail = user?.email;

  // Add this useEffect to get user data when component mounts
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Make all API calls in parallel
      const [ordersResponse, usersResponse, inventoryResponse] = await Promise.all([
        axios.get('http://37.148.210.169:5001/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://37.148.210.169:5001/api/customers', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://37.148.210.169:5001/api/inventory', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Log responses to debug
      console.log('Orders Response:', ordersResponse.data);
      console.log('Users Response:', usersResponse.data);
      console.log('Inventory Response:', inventoryResponse.data);

      // Set states
      setOrders(ordersResponse.data);
      setUsers(usersResponse.data);
      setInventory(inventoryResponse.data);
      setTotalOrders(ordersResponse.data.length);
      setPendingOrders(ordersResponse.data.filter(order => order.status === 'Pending').length);

      // Calculate daily orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = ordersResponse.data.filter(order => {
        const orderDate = new Date(order.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      }).length;
      setDailyOrderCount(todayOrders);

      // Get latest orders for notifications
      const latestOrders = ordersResponse.data
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 5)
        .map(order => ({
          message: `${t('newOrder')}: ${order.productName} - ${order.clientName}`,
          date: order.orderDate,
          status: order.status
        }));

      setNotifications(latestOrders);
      setLastRefresh(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
      setIsLoading(false);
    }
  }, [t]);

  // Add this useEffect to call fetchData when component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add this useEffect to debug data
  useEffect(() => {
    if (!isLoading) {
      console.log('Current Inventory State:', inventory);
      console.log('Current Orders State:', orders);
      console.log('Current Users State:', users);
    }
  }, [inventory, orders, users, isLoading]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
    setLastRefresh(new Date());
  }, [fetchData]);

  // Auto refresh every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(handleRefresh, 300000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Handle creating a new quick order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    // Add validation
    if (!newOrder.clientEmail || !newOrder.productName || !newOrder.quantity || !newOrder.price) {
      alert('Please fill in all fields');
      return;
    }

    setActionLoading(true);
    try {
      // Log the data being sent
      console.log('Sending order data:', {
        clientEmail: newOrder.clientEmail,
        productName: newOrder.productName,
        quantity: parseInt(newOrder.quantity),
        price: parseFloat(newOrder.price)
      });

      // Create order with properly formatted data
      const orderResponse = await axios.post(
        'http://37.148.210.169:5001/api/orders',
        {
          clientEmail: newOrder.clientEmail,
          productName: newOrder.productName,
          quantity: parseInt(newOrder.quantity),
          price: parseFloat(newOrder.price)
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Order response:', orderResponse.data);

      // If order is successful, update inventory
      const selectedProduct = inventory.find(item => item.name === newOrder.productName);
      if (selectedProduct) {
        const newQuantity = selectedProduct.quantity - parseInt(newOrder.quantity);
        
        // Update inventory
        await axios.put(
          `http://37.148.210.169:5001/api/inventory/${selectedProduct.id}`,
          {
            name: selectedProduct.name,
            quantity: newQuantity,
            price: selectedProduct.price,
            description: selectedProduct.description || '',
            category: selectedProduct.category || '',
            supplier: selectedProduct.supplier || ''
          },
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Update local inventory state
        setInventory(prevInventory => 
          prevInventory.map(item => 
            item.id === selectedProduct.id 
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      }

      alert('Order created successfully!');
      setNewOrder({ clientEmail: '', productName: '', quantity: '', price: '' });
      setIsQuickOrderModalOpen(false);
      fetchData(); // Refresh dashboard data

    } catch (error) {
      console.error('Error creating order:', error);
      console.log('Error response:', error.response?.data); // Log the error response
      alert(error.response?.data?.error || 'Failed to create order');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle saving a new customer
  const handleSaveCustomer = async (customer) => {
    try {
      const response = await axios.post('http://37.148.210.169:5001/api/customers', 
        {
          ...customer,
          role: 'user',
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      alert(`Customer ${response.data.name} added successfully!`);
      setIsAddCustomerModalOpen(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };

  // Helper functions for analytics calculations
  const calculateDailySales = (orders) => {
    try {
      // Sort orders by ID (most recent first)
      const sortedOrders = [...orders].sort((a, b) => b.id - a.id);
      const last7DaysOrders = sortedOrders.slice(0, 7);

      return {
        labels: last7DaysOrders.map((_, index) => `Day ${7-index}`),
        data: last7DaysOrders.map(order => parseInt(order.quantity) || 0)  // Only use quantity
      };
    } catch (error) {
      console.error('Error calculating daily quantities:', error);
      return { labels: [], data: [] };
    }
  };

  const calculateWeeklySales = (orders) => {
    try {
      const sortedOrders = [...orders].sort((a, b) => b.id - a.id);
      const totalOrders = sortedOrders.length;
      const ordersPerWeek = Math.ceil(totalOrders / 4);
      
      const weeklyQuantities = Array.from({ length: 4 }, (_, weekIndex) => {
        const weekOrders = sortedOrders.slice(
          weekIndex * ordersPerWeek,
          (weekIndex + 1) * ordersPerWeek
        );

        // Sum only quantities for the week
        return weekOrders.reduce((sum, order) => 
          sum + (parseInt(order.quantity) || 0), 0
        );
      });

      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        data: weeklyQuantities
      };
    } catch (error) {
      console.error('Error calculating weekly quantities:', error);
      return { labels: [], data: [] };
    }
  };

  const calculateSalesByStatus = (orders) => {
    try {
      const statusGroups = {};
      orders.forEach(order => {
        if (order.status) {
          if (!statusGroups[order.status]) {
            statusGroups[order.status] = 0;
          }
          statusGroups[order.status] += Number(order.price) * Number(order.quantity);
        }
      });

      return {
        labels: Object.keys(statusGroups),
        data: Object.values(statusGroups)
      };
    } catch (error) {
      console.error('Error calculating sales by status:', error);
      return { labels: [], data: [] };
    }
  };

  const calculateInventoryLevels = (inventory) => {
    try {
      if (!Array.isArray(inventory) || inventory.length === 0) {
        return {
          labels: ['No Data'],
          data: [0]
        };
      }

      const sortedInventory = [...inventory]
        .filter(item => item && item.name && !isNaN(item.quantity))
        .sort((a, b) => Number(b.quantity) - Number(a.quantity))
        .slice(0, 5);
      
      if (sortedInventory.length === 0) {
        return {
          labels: ['No Data'],
          data: [0]
        };
      }
      
      return {
        labels: sortedInventory.map(item => item.name),
        data: sortedInventory.map(item => Number(item.quantity))
      };
    } catch (error) {
      console.error('Error calculating inventory levels:', error);
      return { labels: [], data: [] };
    }
  };

  const calculateDailyOrderCount = (orders) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;
  };

  const cardsData = [
    {
      title: `${totalOrders} ${t('orders')}`,
      icon: faListAlt,
      description: t('totalOrdersDesc'),
      onClick: () => (window.location.href = "http://37.148.210.169:3000/orders"),
    },
    {
      title: `${pendingOrders} ${t('pending')}`,
      icon: faListCheck,
      description: t('pendingOrdersDesc'),
      onClick: () => {
        const pending = orders.filter(order => order.status === 'Pending')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPendingOrdersList(pending);
        setIsPendingOrdersModalOpen(true);
      },
    },
    {
      title: t('notifications'),
      icon: faBell,
      description: `${dailyOrderCount} ${t('Orders Today')}`,
      badge: dailyOrderCount > 0 ? dailyOrderCount : null,
      onClick: () => setIsNotificationsModalOpen(true),
    },
    {
      title: t('quickOrder'),
      icon: faPlus,
      description: t('quickOrderDesc'),
      onClick: () => setIsQuickOrderModalOpen(true),
    },
    {
      title: t('addCustomer'),
      icon: faUserPlus,
      description: t('addCustomerDesc'),
      onClick: () => setIsAddCustomerModalOpen(true),
    },
    {
      title: t('customerCount', { count: users.filter(user => user.role?.toLowerCase() === 'user' || !user.role).length }),
      icon: faUsers,
      description: t('registeredCustomers'),
      onClick: () => (window.location.href = "http://37.148.210.169:3000/customers"),
    },
    {
      title: t('addSuppliers'),
      icon: faTruck,
      description: t('addSupplierDesc'),
      onClick: () => setIsAddSupplierModalOpen(true),
    },
    {
      title: t('sales'),
      icon: faShoppingCart,
      description: t('salesDesc'),
      onClick: () => (window.location.href = "http://37.148.210.169:3000/sales"),
    },
    {
      title: t('inventory'),
      icon: faWarehouse,
      description: t('inventoryDesc'),
      onClick: () => (window.location.href = "http://37.148.210.169:3000/inventory"),
    },
    {
      title: t('mails'),
      icon: faEnvelope,
      description: t('mailsDesc'),
      onClick: () => {
        window.location.href = "mailto:qubite.net@gmail.com?subject=Hello%20Qubite&body=Write%20your%20message%20here";
      },
    },
  ];

  const renderGraphs = () => {
    if (isLoading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
      <div className="dashboard-graphs">
        <div className="graph-container">
          <h3>{t('dailySales')}</h3>
          <Line
            data={{
              labels: analytics.dailySales.labels,
              datasets: [{
                label: 'Daily Order Quantities',
                data: analytics.dailySales.data,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => `${t('orderQuantity')}: ${context.raw}`
                  }
                }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: t('orderQuantity')
                  }
                }
              }
            }}
          />
        </div>

        <div className="graph-container">
          <h3>{t('weeklySales')}</h3>
          <Bar
            data={{
              labels: analytics.weeklySales.labels,
              datasets: [{
                label: 'Weekly Order Quantities',
                data: analytics.weeklySales.data,
                backgroundColor: 'rgb(54, 162, 235)'
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => `${t('orderQuantity')}: ${context.raw}`
                  }
                }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: t('orderQuantity')
                  }
                }
              }
            }}
          />
        </div>

        <div className="graph-container">
          <h3>{t('salesByStatus')}</h3>
          <Doughnut
            data={{
              labels: analytics.salesByStatus.labels,
              datasets: [{
                data: analytics.salesByStatus.data,
                backgroundColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF'
                ]
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' }
              }
            }}
          />
        </div>

        <div className="graph-container">
          <h3>{t('inventoryLevels')}</h3>
          <Bar
            data={{
              labels: analytics.inventoryLevels.labels,
              datasets: [{
                label: 'Stock Quantity',
                data: analytics.inventoryLevels.data,
                backgroundColor: 'rgb(75, 192, 192)'
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>
      </div>
    );
  };

  // Add console logging to debug data
  useEffect(() => {
    if (!isLoading) {
      console.log('Analytics Data:', analytics);
      console.log('Raw Orders:', orders);
      console.log('Raw Users:', users);
      console.log('Raw Inventory:', inventory);
    }
  }, [analytics, orders, users, inventory, isLoading]);

  // Add this debug logging right after setting the analytics state
  useEffect(() => {
    if (analytics.dailySales?.data) {
      console.log('Daily Sales Data:', {
        labels: analytics.dailySales.labels,
        data: analytics.dailySales.data
      });
    }
    if (analytics.weeklySales?.data) {
      console.log('Weekly Sales Data:', {
        labels: analytics.weeklySales.labels,
        data: analytics.weeklySales.data
      });
    }
  }, [analytics]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>{t('adminDashboard')}</h2>
          {user && <h1>Welcome, {user.name}!</h1>}
        </div>
        <div className="dashboard-controls">
          <span className="last-refresh">
            {t('lastUpdated')}: {lastRefresh.toLocaleTimeString()}
          </span>
          <button 
            onClick={handleRefresh}
            className="refresh-btn"
            disabled={isLoading}
          >
            <FontAwesomeIcon 
              icon={faSync} 
              className={isLoading ? 'fa-spin' : ''} 
            />
          </button>
        </div>
      </div>
      {error && (
        <div className="error-message">
          {t('errorLoadingData')}
          <button onClick={handleRefresh}>{t('tryAgain')}</button>
        </div>
      )}
      <div className="dashboard-cards">
        {cardsData.map((card, index) => (
          <div 
            key={index} 
                        className="dashboard-card" 
            onClick={card.onClick}
            title={card.description}
          >
            {isLoading ? (
              <div className="loading-overlay">
                <div className="loading-spinner" />
              </div>
            ) : (
              <>
                {card.badge && <span className="card-badge">{card.badge}</span>}
                <FontAwesomeIcon icon={card.icon} className="card-main-icon" />
                <h4>{card.title}</h4>
                <p>{card.description}</p>
                {card.quickStats && (
                  <div className="quick-stats">
                    {card.quickStats.map((stat, i) => (
                      <div key={i} className="stat-item">
                        <small>{stat.label}</small>
                        <span>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {card.quickActions && (
                  <div className="card-quick-actions">
                    {card.quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick();
                        }}
                        className="quick-action-btn"
                      >
                        <FontAwesomeIcon icon={action.icon} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Quick Order Modal */}
        <Modal isOpen={isQuickOrderModalOpen} onClose={() => setIsQuickOrderModalOpen(false)}>
          <h2>{t('quickOrderCreation')}</h2>
          <form onSubmit={handleCreateOrder}>
            <div className="form-row">
              <select
                value={newOrder.clientEmail}
                onChange={(e) => setNewOrder({ ...newOrder, clientEmail: e.target.value })}
                required
              >
                <option value="">{t('selectAUser')}</option>
                {users.map((user) => (
                  <option key={user.email} value={user.email}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <select
                value={newOrder.productName}
                onChange={(e) => {
                  const selectedProduct = inventory.find(
                    (item) => item.name === e.target.value
                  );
                  setNewOrder({
                    ...newOrder,
                    productName: e.target.value,
                    price: selectedProduct?.price || '',
                  });
                }}
                required
              >
                <option value="">{t('selectAProduct')}</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name} ({t('stock')}: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Quantity"
                value={newOrder.quantity}
                onChange={(e) =>
                  setNewOrder({ ...newOrder, quantity: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={newOrder.price}
                readOnly
                required
              />
            </div>
            <button
              type="submit"
              className={`order-button ${actionLoading ? 'loading' : ''}`}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <i className="fa fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fa fa-plus"></i> {t('createOrder')}
                </>
              )}
            </button>
          </form>
        </Modal>

   {/* Add Customer Modal */}
<Modal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)}>
  <AddCustomer
    onSave={(formData) => handleSaveCustomer(formData)}
    onClose={() => setIsAddCustomerModalOpen(false)}
  />
</Modal>


      {/* Add Supplier Modal */}
      <Modal isOpen={isAddSupplierModalOpen} onClose={() => setIsAddSupplierModalOpen(false)}>
        <AddSupplier />
      </Modal>

      {/* Notifications Modal */}
      <Modal isOpen={isNotificationsModalOpen} onClose={() => setIsNotificationsModalOpen(false)}>
        <h2>{t('notifications')}</h2>
        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                <span className={`notification-status ${notification.status.toLowerCase()}`}></span>
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <small>{new Date(notification.date).toLocaleString()}</small>
                </div>
                <span className="notification-badge">{notification.status}</span>
              </div>
            ))
          ) : (
            <div className="no-notifications">
              <p>{t('noNotifications')}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Pending Orders Modal */}
      <Modal isOpen={isPendingOrdersModalOpen} onClose={() => setIsPendingOrdersModalOpen(false)}>
        <div className="dashboard-pending-orders">
          <h2>Pending Orders</h2>
          <div className="dashboard-pending-list">
            {pendingOrdersList.length > 0 ? (
              <table className="dashboard-pending-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Product</th>
                    <th>Status</th>
                    
                  </tr>
                </thead>
                <tbody>
                  {pendingOrdersList.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.clientName}</td>
                      <td>{order.productName}</td>
                      <td>
                        <span className="dashboard-status-badge pending">{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="dashboard-no-pending">
                <p>{t('noPendingOrders')}</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
      </div>
      {renderGraphs()}
    </div>
  );
}

export default DashboardCards;
