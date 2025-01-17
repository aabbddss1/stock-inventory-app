import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { api } from '../config/api';
import Calendar from '../components/Calendar';
import Notifications from '../components/Notifications';
import '../styles/UserPanel.css';
import '../styles/UserEnhancements.css';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Modal from '../components/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

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

const UserPanel = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]); // User-specific orders
  const [inventory, setInventory] = useState([]); // Add inventory state
  const [tasks, setTasks] = useState([]); // Task Manager
  const [newTask, setNewTask] = useState('');
  const [analytics, setAnalytics] = useState({
    inventoryLevels: {
      labels: [],
      data: []
    },
    statusDistribution: {
      labels: [],
      data: []
    }
  });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [isQuickOrderModalOpen, setIsQuickOrderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // Add this for order creation loading
  const [newOrder, setNewOrder] = useState({
    productName: '',
    quantity: '',
    price: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        // Fetch user details
        const response = await api.get('/api/customers/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setUser(response.data);

        // Fetch orders, inventory, and notifications
        fetchUserOrders(response.data.id);
        fetchInventory();
        fetchNotifications();
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to fetch user data');
      }
    };

    fetchUser();
  }, [navigate]);

  // New useEffect for admin route protection
  useEffect(() => {
    if (user) {
      const adminRoutes = ['/admin', '/sales', '/documents', '/analytics', '/settings'];
      const currentPath = window.location.pathname;
      
      if (!user.isAdmin && adminRoutes.some(route => currentPath.includes(route))) {
        navigate('/user-panel');
      }
    }
  }, [user, navigate]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      // Get order status notifications
      const orderStatusNotifications = orders
        .filter(order => order.statusChangeDate) // Only get orders with status changes
        .sort((a, b) => new Date(b.statusChangeDate) - new Date(a.statusChangeDate))
        .map(order => ({
          id: `status-${order.id}`,
          message: `Order #${order.id} status changed to ${order.status}`,
          date: order.statusChangeDate,
          type: 'status_change',
          status: order.status,
          isRead: false
        }));

      // Combine with other notifications and sort by date
      const allNotifications = [...orderStatusNotifications, ...response.data]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Add useEffect to check for order status changes
  useEffect(() => {
    if (orders.length > 0) {
      // Fetch notifications when orders change (status changes)
      fetchNotifications();
    }
  }, [orders]);

  const fetchUserOrders = async (userId) => {
    try {
      const response = await api.get(`/api/orders?userId=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTaskCompletion = (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].completed = !updatedTasks[index].completed;
    setTasks(updatedTasks);
  };

  const removeTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Add fetchInventory function
  const fetchInventory = async () => {
    try {
      const response = await api.get('/api/inventory', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  // Update analytics calculation
  useEffect(() => {
    // Calculate status distribution from orders
    if (orders.length > 0) {
      const statusCount = orders.reduce((acc, order) => {
        const status = order.status || 'Pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusDistribution = {
        labels: Object.keys(statusCount),
        data: Object.values(statusCount)
      };

      setAnalytics(prev => ({
        ...prev,
        statusDistribution
      }));
    }
  }, [orders]);

  // Add inventory analytics calculation
  useEffect(() => {
    if (inventory.length > 0) {
      // Sort inventory by quantity and get top 5 items
      const topInventory = [...inventory]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const inventoryLevels = {
        labels: topInventory.map(item => item.name),
        data: topInventory.map(item => item.quantity)
      };

      setAnalytics(prev => ({
        ...prev,
        inventoryLevels
      }));
    }
  }, [inventory]);

  const handleQuickOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.productName || !newOrder.quantity) {
      alert('Please select a product and specify quantity');
      return;
    }

    setActionLoading(true);
    try {
      const selectedProduct = inventory.find(item => item.name === newOrder.productName);
      
      if (!selectedProduct) {
        alert('Selected product not found');
        return;
      }

      if (selectedProduct.quantity < parseInt(newOrder.quantity)) {
        alert('Not enough stock available');
        return;
      }

      // Create order
      const orderData = {
        clientName: user.name,
        productName: selectedProduct.name,
        quantity: parseInt(newOrder.quantity),
        price: parseFloat(selectedProduct.price),
        clientEmail: user.email,
        status: 'Pending'
      };

      // First create the order
      const orderResponse = await api.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Update inventory with complete payload
      const inventoryUpdateData = {
        name: selectedProduct.name,
        quantity: selectedProduct.quantity - parseInt(newOrder.quantity),
        price: selectedProduct.price,
        description: selectedProduct.description || '',
        category: selectedProduct.category || '',
        supplier: selectedProduct.supplier || ''
      };

      // Update inventory
      await api.put(
        `/api/inventory/${selectedProduct.id}`,
        inventoryUpdateData,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Reset form and close modal
      setNewOrder({ productName: '', quantity: '', price: '' });
      setIsQuickOrderModalOpen(false);

      // Refresh data
      await Promise.all([
        fetchUserOrders(user.id),
        fetchInventory()
      ]);

      // Show success message
      alert('Order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.error || 'Failed to create order');
    } finally {
      setActionLoading(false);
    }
  };

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading user details...</p>;

  return (
    <div className="user-panel">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="user-panel-container">
          <h1>Welcome, {user.name}!</h1>

          {/* Quick Statistics */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Orders</h3>
              <p>{orders.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Orders</h3>
              <p>{orders.filter((order) => order.status === 'Pending').length}</p>
            </div>
            <div className="stat-card">
              <h3>Notifications</h3>
              <p>{notifications.length}</p>
            </div>
          </div>

          {/* User Details and Quick Order Section */}
          <div className="user-info-section">
            <div className="user-details-section">
              <h2>User Details</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone}</p>
              <p><strong>Last Logged In:</strong> {
                new Date(user.lastLoggedIn || new Date()).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }</p>
            </div>

            <div className="quick-order-card" onClick={() => setIsQuickOrderModalOpen(true)}>
              <FontAwesomeIcon icon={faPlus} className="card-icon" />
              <h2>Quick Order</h2>
              <p>Create a new order quickly</p>
            </div>
          </div>

          {/* Quick Order Modal */}
          <Modal isOpen={isQuickOrderModalOpen} onClose={() => !actionLoading && setIsQuickOrderModalOpen(false)}>
            <h2>Create Quick Order</h2>
            <form onSubmit={handleQuickOrder} className="quick-order-form">
              <select 
                className="quick-order-select"
                value={newOrder.productName}
                onChange={(e) => {
                  const selectedProduct = inventory.find(item => item.name === e.target.value);
                  setNewOrder({
                    ...newOrder,
                    productName: e.target.value,
                    price: selectedProduct?.price || ''
                  });
                }}
                disabled={actionLoading}
                required
              >
                <option value="">Select Product</option>
                {Array.isArray(inventory) && inventory.length > 0 ? (
                  inventory.map(item => (
                    <option key={item.id} value={item.name}>
                      {item.name} - Stock: {item.quantity} - Price: ${item.price}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No products available</option>
                )}
              </select>
              <input 
                type="number" 
                className="quick-order-input"
                placeholder="Quantity"
                min="1"
                max={inventory.find(item => item.name === newOrder.productName)?.quantity || 1}
                value={newOrder.quantity}
                onChange={(e) => {
                  const selectedProduct = inventory.find(item => item.name === newOrder.productName);
                  const quantity = parseInt(e.target.value);
                  if (!selectedProduct || quantity > selectedProduct.quantity) {
                    alert('Not enough stock available');
                    return;
                  }
                  setNewOrder({ ...newOrder, quantity: e.target.value });
                }}
                disabled={actionLoading}
                required
              />
              <div className="order-summary">
                {newOrder.productName && newOrder.quantity ? (
                  <p>
                    Total Price: $
                    {(inventory.find(item => item.name === newOrder.productName)?.price * parseInt(newOrder.quantity || 0)).toFixed(2)}
                  </p>
                ) : null}
              </div>
              <button 
                type="submit"
                className={`quick-order-button ${actionLoading ? 'loading' : ''}`}
                disabled={!newOrder.productName || !newOrder.quantity || actionLoading}
              >
                {actionLoading ? (
                  <div className="loader">Loading...</div>
                ) : 'Place Order'}
              </button>
            </form>
          </Modal>

          {/* Analytics Graphs */}
          <div className="analytics-section two-columns">
            <div className="graph-container">
              <h3>Inventory Levels</h3>
              <Bar
                data={{
                  labels: analytics.inventoryLevels.labels,
                  datasets: [{
                    label: 'Stock Quantity',
                    data: analytics.inventoryLevels.data,
                    backgroundColor: [
                      '#36A2EB',
                      '#4BC0C0',
                      '#FF6384',
                      '#FFCE56',
                      '#9966FF'
                    ]
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: (context) => `Stock: ${context.raw} units`
                      }
                    }
                  },
                  scales: {
                    y: { 
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Quantity in Stock'
                      }
                    }
                  }
                }}
              />
            </div>

            <div className="graph-container">
              <h3>Order Status Distribution</h3>
              <Doughnut
                data={{
                  labels: analytics.statusDistribution.labels,
                  datasets: [{
                    data: analytics.statusDistribution.data,
                    backgroundColor: [
                      '#FF6384',
                      '#36A2EB',
                      '#FFCE56',
                      '#4BC0C0'
                    ]
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      position: 'bottom',
                      labels: {
                        padding: 20
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Recent Orders */}
          <div className="recent-orders-section">
            <h2>Recent Orders</h2>
            <div className="orders-container">
              {orders
                .sort((a, b) => {
                  const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
                  const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
                  return dateB - dateA;
                })
                .slice(0, 5)
                .map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-id">Order #{order.id}</div>
                      <div className={`order-status ${order.status?.toLowerCase()}`}>
                        {order.status}
                      </div>
                    </div>
                    <div className="order-details">
                      <div className="order-info">
                        <div className="info-row">
                          <span className="info-label">Product</span>
                          <span className="info-value">{order.productName}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Quantity</span>
                          <span className="info-value">{order.quantity}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Date</span>
                          <span className="info-value">
                            {order.orderDate ? new Date(order.orderDate).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {orders.length === 0 && (
                <div className="no-orders">
                  <p>No recent orders available.</p>
                </div>
              )}
            </div>
          </div>

          <div className="user-panel-content">
            {/* Notifications */}
            <div className="notifications-section">
              <Notifications notifications={notifications} />
            </div>

            {/* Calendar */}
            <div className="calendar-section">
              <h2>Your Calendar</h2>
              <Calendar />
            </div>

            {/* Task Manager */}
            <div className="task-manager">
              <h2>Task Manager</h2>
              <div className="task-input">
                <input
                  type="text"
                  placeholder="Add a new task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
                <button onClick={addTask}>Add</button>
              </div>
              <ul className="task-list">
                {tasks.map((task, index) => (
                  <li key={index} className={`task-item ${task.completed ? 'completed' : ''}`}>
                    <span>{task.text}</span>
                    <div className="task-buttons">
                      <button onClick={() => toggleTaskCompletion(index)} className="complete-btn">
                        {task.completed ? 'Undo' : 'Complete'}
                      </button>
                      <button onClick={() => removeTask(index)} className="delete-btn">
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {tasks.length === 0 && (
                <p className="no-tasks">No tasks available. Start adding your tasks!</p>
              )}
            </div>
          </div>

          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
