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

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading user details...</p>;

  return (
    <div className="user-panel">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="user-panel-container">
          <div className="welcome-section">
            <div className="welcome-text">
              <h1>Welcome, {user.name}</h1>
              <p className="welcome-description">
                Efficiently track, manage, and optimize your inventory and customers with our advanced stock
                management solution. Qubite ensures seamless order processing, real-time updates, and insightful
                analytics to help you make smarter business decisions.
              </p>
            </div>
            <div className="user-info-card">
              <h3>User Details</h3>
              <div className="user-info-content">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone}</p>
                <p><strong>Last Logged In:</strong> {user.lastLoggedIn}</p>
              </div>
            </div>
          </div>

          {/* Quick Statistics Cards */}
          <div className="dashboard-stats">
            <div className="stat-card total-orders">
              <h3>Total Orders</h3>
              <p className="stat-number">{orders.length}</p>
            </div>
            <div className="stat-card pending-orders">
              <h3>Pending Orders</h3>
              <p className="stat-number">{orders.filter(order => order.status === 'Pending').length}</p>
            </div>
            <div className="stat-card notifications">
              <h3>Notifications</h3>
              <p className="stat-number">{notifications.length}</p>
            </div>
            <div className="stat-card quick-order">
              <h3>Quick Order</h3>
              <button className="quick-order-btn">+</button>
            </div>
            <div className="stat-card help-card">
              <h3>Need help?</h3>
              <p>You can check the documentations or you can contact to our call center.</p>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="analytics-section">
            <div className="graph-container inventory-chart">
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
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `Stock: ${context.raw} units`
                      }
                    }
                  },
                  scales: {
                    y: { 
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            </div>

            <div className="graph-container status-chart">
              <h3>Order Status Distribution</h3>
              <Doughnut
                data={{
                  labels: ['Approved', 'Completed', 'On Process', 'Pending'],
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
                        padding: 20,
                        usePointStyle: true
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Task Manager and Calendar Section */}
          <div className="bottom-section">
            <div className="task-calendar-container">
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

              <div className="calendar-section">
                <Calendar />
              </div>
            </div>

            <div className="notifications-section">
              <Notifications notifications={notifications} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
