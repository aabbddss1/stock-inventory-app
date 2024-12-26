import React, { useState, useEffect } from 'react';
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
  faPlus 
} from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import AddCustomer from '../pages/AddCustomer';
import AddSupplier from '../pages/AddSupplier';
import axios from 'axios'; // Axios for API calls
import '../styles/DashboardCards.css';

function DashboardCards() {
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [isQuickOrderModalOpen, setIsQuickOrderModalOpen] = useState(false); // Quick Order Modal State

  const [newOrder, setNewOrder] = useState({
    clientEmail: '',
    productName: '',
    quantity: '',
    price: '',
  });

  const [users, setUsers] = useState([]); // List of users for admin dropdown
  const [actionLoading, setActionLoading] = useState(false);

  // State for dynamic data
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    // Fetch dynamic data for dashboard cards
    const fetchData = async () => {
      try {
        const ordersResponse = await axios.get('http://localhost:5001/api/orders');
        const notificationsResponse = await axios.get('http://localhost:5001/api/notifications');
        const usersResponse = await axios.get('http://localhost:5001/api/customers'); // Fetch users

        setTotalOrders(ordersResponse.data.length);
        setPendingOrders(ordersResponse.data.filter(order => order.status === 'Pending').length);
        setNotifications(notificationsResponse.data.length);
        setUsers(usersResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

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
      onClick: () => (window.location.href = "http://localhost:3000/orders"),
    },
    {
      title: "Notifications",
      icon: faBell,
      description: `${notifications} notifications available.`,
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
      title: "Add Suppliers",
      icon: faTruck,
      onClick: () => setIsAddSupplierModalOpen(true),
    },
    {
      title: "Sales",
      icon: faShoppingCart,
      onClick: () => (window.location.href = "http://localhost:3000/sales"),
    },
    { title: "Orders", icon: faClipboardList },
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
    <div className="dashboard-cards">
      {cardsData.map((card, index) => (
        <div key={index} className="dashboard-card" onClick={card.onClick}>
          <FontAwesomeIcon icon={card.icon} className="card-main-icon" />
          <h4>{card.title}</h4>
          <p>{card.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}</p>
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
            <input
              type="text"
              placeholder="Product Name"
              value={newOrder.productName}
              onChange={(e) =>
                setNewOrder({ ...newOrder, productName: e.target.value })
              }
              required
            />
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
              onChange={(e) =>
                setNewOrder({ ...newOrder, price: e.target.value })
              }
              required
            />
          </div>
          <button type="submit" disabled={actionLoading}>
            {actionLoading ? 'Creating...' : 'Create Order'}
          </button>
        </form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)}>
        <AddCustomer />
      </Modal>

      {/* Add Supplier Modal */}
      <Modal isOpen={isAddSupplierModalOpen} onClose={() => setIsAddSupplierModalOpen(false)}>
        <AddSupplier />
      </Modal>
    </div>
  );
}

export default DashboardCards;
