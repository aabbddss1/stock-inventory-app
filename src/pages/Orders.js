import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import axios from 'axios';
import '../styles/Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]); // For search functionality
  const [searchTerm, setSearchTerm] = useState(''); // Search input state
  const [users, setUsers] = useState([]); // List of registered users for admin
  const [loading, setLoading] = useState(true); // Page loading state
  const [actionLoading, setActionLoading] = useState(false); // Action-specific loading state
  const [selectedOrder, setSelectedOrder] = useState(null); // For editing orders
  const [newOrder, setNewOrder] = useState({
    clientEmail: '',
    productName: '',
    quantity: '',
    price: '',
  });

  const token = localStorage.getItem('token');
  const userData = JSON.parse(atob(token.split('.')[1])); // Decode token to get user data
  const userRole = userData.role; // User role (admin or user)

  // Fetch orders and users (admin)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders
        const ordersResponse = await axios.get('http://localhost:5001/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(ordersResponse.data);
        setFilteredOrders(ordersResponse.data); // Initialize filtered orders

        // Fetch users for admin
        if (userRole === 'admin') {
          const usersResponse = await axios.get('http://localhost:5001/api/customers', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsers(usersResponse.data);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token, userRole]);

  // Handle search functionality
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = orders.filter(
      (order) =>
        order.clientName.toLowerCase().includes(value) ||
        order.productName.toLowerCase().includes(value) ||
        order.status.toLowerCase().includes(value)
    );
    setFilteredOrders(filtered);
  };

  // Export to Excel functionality
  const exportToExcel = () => {
    const worksheet = XLSXUtils.json_to_sheet(filteredOrders);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSXWriteFile(workbook, 'orders_data.xlsx');
  };

  // Handle creating a new order
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    // Set the clientEmail for non-admin users
    const orderData = userRole === 'admin' ? newOrder : { ...newOrder, clientEmail: userData.email };

    setActionLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders([...orders, response.data]);
      setFilteredOrders([...orders, response.data]); // Update filteredOrders as well
      setNewOrder({ clientEmail: '', productName: '', quantity: '', price: '' });
      alert('Order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle deleting an order
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      setActionLoading(true);
      try {
        await axios.delete(`http://localhost:5001/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
        setFilteredOrders((prevOrders) => prevOrders.filter((order) => order.id !== id)); // Update filteredOrders
        alert('Order deleted successfully!');
      } catch (error) {
        console.error('Error deleting order:', error);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle changing the order status
  const handleStatusChange = async (id, newStatus) => {
    const updatedOrder = orders.find((order) => order.id === id);
    updatedOrder.status = newStatus;

    setActionLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/orders/${id}`, updatedOrder, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id ? { ...order, status: newStatus } : order
        )
      );
      setFilteredOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id ? { ...order, status: newStatus } : order
        )
      );
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle editing an order
  const handleEditOrder = (order) => {
    setSelectedOrder(order);
  };

  // Handle saving changes to an order
  const handleSaveOrder = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/orders/${selectedOrder.id}`, selectedOrder, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === selectedOrder.id ? selectedOrder : order
        )
      );
      setFilteredOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === selectedOrder.id ? selectedOrder : order
        )
      );
      setSelectedOrder(null);
      alert('Order updated successfully!');
    } catch (error) {
      console.error('Error saving order changes:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="orders-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="orders-container">
          <h1>Orders</h1>

          {/* Search and Export Actions */}
          <div className="orders-actions">
            <input
              type="text"
              placeholder="Search by Client, Product, or Status"
              value={searchTerm}
              onChange={handleSearch}
            />
            <button onClick={exportToExcel}>Export to Excel</button>
          </div>

          {/* Create Order Form */}
          {(userRole === 'admin' || userRole === 'user') && (
            <div className="create-order-form">
              <h2>Create New Order</h2>
              <form onSubmit={handleCreateOrder}>
                {userRole === 'admin' && (
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
                )}
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
                  {actionLoading ? 'Processing...' : 'Create Order'}
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <p>Loading orders...</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Status</th>
                  {userRole === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.clientName}</td>
                    <td>{order.productName}</td>
                    <td>{order.quantity}</td>
                    <td>${order.price}</td>
                    <td>
                      {userRole === 'admin' ? (
                        <select
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          value={order.status}
                          disabled={actionLoading}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="On Process">On Process</option>
                          <option value="Completed">Completed</option>
                        </select>
                      ) : (
                        order.status
                      )}
                    </td>
                    {userRole === 'admin' && (
                      <td>
                        <button
                          onClick={() => handleEditOrder(order)}
                          disabled={actionLoading}
                        >
                          Edit
                        </button>
                        <button
                          style={{ backgroundColor: 'red', color: 'white' }}
                          onClick={() => handleDelete(order.id)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing...' : 'Delete'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Edit Order Form */}
          {selectedOrder && (
            <div className="edit-order">
              <h2>Edit Order</h2>
              <form onSubmit={handleSaveOrder}>
                <input
                  type="text"
                  value={selectedOrder.productName}
                  onChange={(e) =>
                    setSelectedOrder({
                      ...selectedOrder,
                      productName: e.target.value,
                    })
                  }
                  placeholder="Product Name"
                  required
                />
                <input
                  type="number"
                  value={selectedOrder.quantity}
                  onChange={(e) =>
                    setSelectedOrder({
                      ...selectedOrder,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="Quantity"
                  required
                />
                <input
                  type="number"
                  value={selectedOrder.price}
                  onChange={(e) =>
                    setSelectedOrder({
                      ...selectedOrder,
                      price: e.target.value,
                    })
                  }
                  placeholder="Price"
                  required
                />
                <button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
