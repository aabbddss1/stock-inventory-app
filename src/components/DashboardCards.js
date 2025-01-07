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
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import AddCustomer from '../pages/AddCustomer';
import AddSupplier from '../pages/AddSupplier';
import axios from 'axios'; // Axios for API calls
import '../styles/DashboardCards.css';

function DashboardCards() {
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [isQuickOrderModalOpen, setIsQuickOrderModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isPendingOrdersModalOpen, setIsPendingOrdersModalOpen] = useState(false);

  const [newOrder, setNewOrder] = useState({
    clientEmail: '',
    productName: '',
    quantity: '',
    price: '',
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordersResponse, notificationsResponse, usersResponse, inventoryResponse] = 
        await Promise.all([
          axios.get('http://localhost:5001/api/orders'),
          axios.get('http://localhost:5001/api/notifications'),
          axios.get('http://localhost:5001/api/customers'),
          axios.get('http://localhost:5001/api/inventory')
        ]);

      setOrders(ordersResponse.data);
      setTotalOrders(ordersResponse.data.length);
      setPendingOrders(ordersResponse.data.filter(order => order.status === 'Pending').length);
      setNotifications(notificationsResponse.data);
      setUsers(usersResponse.data);
      setInventory(inventoryResponse.data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Handle creating a new quick order
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!newOrder.clientEmail) {
      alert('Please select a user.');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post('http://localhost:5001/api/orders', newOrder);
      alert('Quick order created successfully!');
      setNewOrder({ clientEmail: '', productName: '', quantity: '', price: '' });
      setIsQuickOrderModalOpen(false); // Close modal after creation
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create quick order.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle saving a new customer
  const handleSaveCustomer = async (customer) => {
    try {
      const response = await axios.post('http://localhost:5001/api/customers', {
        ...customer,
        role: 'user', // Default role for quick addition
      });
      alert(`Customer ${response.data.name} added successfully!`);
      setIsAddCustomerModalOpen(false); // Close the modal after successful save
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };
  

  const cardsData = [
    {
      title: `${totalOrders} Orders`,
      icon: faListAlt,
      description: `total orders in the system.`,
      onClick: () => (window.location.href = "http://localhost:3000/orders"),
    },
    {
      title: `${pendingOrders} Pending`,
      icon: faListCheck,
      description: `orders are pending.`,
      onClick: () => {
        // Filter orders directly from the orders state
        const pending = orders.filter(order => order.status === 'Pending')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first
        setPendingOrdersList(pending);
        setIsPendingOrdersModalOpen(true);
      },
    },
    {
      title: "Notifications",
      icon: faBell,
      description: `${notifications.length} notifications available.`,
      badge: notifications.length > 0 ? notifications.length : null,
      onClick: () => setIsNotificationsModalOpen(true),
    },
    {
      title: "Quick Order",
      icon: faPlus,
      description: "Create a quick order.",
      onClick: () => setIsQuickOrderModalOpen(true),
    },
    {
      title: "Add Customer",
      icon: faUserPlus,
      onClick: () => setIsAddCustomerModalOpen(true),
    },
    {
      title: `${users.length} Customers`,
      icon: faUsers,
      description: 'registered customers.',
      onClick: () => (window.location.href = "http://localhost:3000/customers"),
    },
    {
      title: "Add Suppliers",
      icon: faTruck,
      onClick: () => setIsAddSupplierModalOpen(true),
    },
    {
      title: "Sales",
      icon: faShoppingCart,
      onClick: () => (window.location.href = "http://localhost:3000/sales"),
    },
   
    {
      title: "Inventory",
      icon: faWarehouse,
      onClick: () => (window.location.href = "http://localhost:3000/inventory"),
    },
    {
      title: "Mails",
      icon: faEnvelope,
      onClick: () => {
        window.location.href = "mailto:qubite.net@gmail.com?subject=Hello%20Qubite&body=Write%20your%20message%20here";
      },
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="dashboard-controls">
          <span className="last-refresh">
            Last updated: {lastRefresh.toLocaleTimeString()}
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
          {error}
          <button onClick={handleRefresh}>Try Again</button>
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
          <h2>Quick Order Creation</h2>
          <form onSubmit={handleCreateOrder}>
            <div className="form-row">
              <select
                value={newOrder.clientEmail}
                onChange={(e) =>
                  setNewOrder({ ...newOrder, clientEmail: e.target.value })
                }
                required
              >
                <option value="">Select a User</option>
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
                <option value="">Select a Product</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name} (Stock: {item.quantity})
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
    <i className="fa fa-spinner fa-spin"></i> // Dönen yuvarlak
  ) : (
    <>
      <i className="fa fa-plus"></i> Create Order
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
        <h2>Notifications</h2>
        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                <span className="notification-dot"></span>
                <p>{notification.message}</p>
                <small>{new Date(notification.date).toLocaleDateString()}</small>
              </div>
            ))
          ) : (
            <div className="no-notifications">
              <p>No notifications available</p>
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
                <p>No pending orders available</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}

export default DashboardCards;
