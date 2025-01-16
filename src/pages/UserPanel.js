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
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

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

  const handleQuickOrder = async () => {
    if (!selectedProduct || !orderQuantity) {
      alert('Please select a product and specify quantity');
      return;
    }

    try {
      const response = await api.post('/api/orders', {
        productId: selectedProduct,
        quantity: parseInt(orderQuantity),
        userId: user.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Refresh orders after placing new order
      fetchUserOrders(user.id);
      
      // Reset form
      setSelectedProduct('');
      setOrderQuantity('');
      
      alert('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
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
              <p><strong>Last Logged In:</strong> {user.lastLoggedIn}</p>
            </div>

            <div className="quick-order-card" onClick={() => setIsQuickOrderModalOpen(true)}>
              <FontAwesomeIcon icon={faPlus} className="card-icon" />
              <h2>Quick Order</h2>
              <p>Create a new order quickly</p>
            </div>
          </div>

          {/* Quick Order Modal */}
          <Modal isOpen={isQuickOrderModalOpen} onClose={() => setIsQuickOrderModalOpen(false)}>
            <h2>Create Quick Order</h2>
            <div className="quick-order-form">
              <select 
                className="quick-order-select"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Select Product</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <input 
                type="number" 
                className="quick-order-input"
                placeholder="Quantity"
                min="1"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
              />
              <button 
                className="quick-order-button"
                onClick={handleQuickOrder}
              >
                Place Order
              </button>
            </div>
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
