import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { api } from '../config/api';
import Calendar from '../components/Calendar';
import Notifications from '../components/Notifications';
import '../styles/UserPanel.css';
import '../styles/UserEnhancements.css';

const UserPanel = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]); // User-specific orders
  const [tasks, setTasks] = useState([]); // Task Manager
  const [newTask, setNewTask] = useState('');
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

        // Fetch orders and notifications
        fetchUserOrders(response.data.id);
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

          {/* User Details */}
          <div className="user-details-section">
            <h2>User Details</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Last Logged In:</strong> {user.lastLoggedIn}</p>
          </div>

          {/* Recent Orders */}
          <div className="recent-orders-section">
  <h2>Recent Orders</h2>
  <ul>
    {orders
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date (latest first)
      .slice(0, 10) // Get the first 10 orders
      .map((order) => (
        <li key={order.id} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Order #{order.id} - {order.status} 
          </div>
          <div>
            <strong>Product:</strong> {order.productName}
          </div>
          <div>
            <strong>Quantity:</strong> {order.quantity}
          </div>
          <div>
            <strong>Date:</strong> {order.date}
          </div>
        
        </li>
      ))}
  </ul>
  {orders.length === 0 && <p>No recent orders available.</p>}
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
