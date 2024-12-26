import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import axios from 'axios';
import '../styles/Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]); // List of registered users
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    clientEmail: '',
    productName: '',
    quantity: '',
    price: '',
  });
  const token = localStorage.getItem('token');
  const userData = JSON.parse(atob(token.split('.')[1])); // Decode token to get user data
  const userRole = userData.role;

  // Fetch orders and users for admin
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersResponse = await axios.get('http://localhost:5001/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(ordersResponse.data);

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

  // Handle creating a new order
  const handleCreateOrder = (e) => {
    e.preventDefault();

    if (!newOrder.clientEmail) {
      alert('Please select a user.');
      return;
    }

    axios
      .post('http://localhost:5001/api/orders', newOrder, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setOrders([...orders, response.data]);
        setNewOrder({ clientEmail: '', productName: '', quantity: '', price: '' });
        alert('Order created successfully!');
      })
      .catch((error) => {
        console.error('Error creating order:', error);
      });
  };

  // Handle delete order
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      axios
        .delete(`http://localhost:5001/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
          alert('Order deleted successfully!');
        })
        .catch((error) => console.error('Error deleting order:', error));
    }
  };

  // Handle order status change
  const handleStatusChange = (id, newStatus) => {
    const updatedOrder = orders.find((order) => order.id === id);
    updatedOrder.status = newStatus;

    axios
      .put(`http://localhost:5001/api/orders/${id}`, updatedOrder, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === id ? { ...order, status: newStatus } : order
          )
        );
        alert('Order status updated successfully!');
      })
      .catch((error) => console.error('Error updating order status:', error));
  };

  // Handle saving changes to an order
  const handleSaveOrder = (e) => {
    e.preventDefault();

    axios
      .put(`http://localhost:5001/api/orders/${selectedOrder.id}`, selectedOrder, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === selectedOrder.id ? selectedOrder : order
          )
        );
        setSelectedOrder(null);
        alert('Order updated successfully!');
      })
      .catch((error) => console.error('Error saving order changes:', error));
  };

  return (
    <div className="orders-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="orders-container">
          <h1>Orders</h1>

          {/* Create Order Form (Admin and User) */}
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
                <button type="submit">Create Order</button>
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
                {orders.map((order) => (
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
                        <button onClick={() => setSelectedOrder(order)}>Edit</button>
                        <button
                          style={{ backgroundColor: 'red', color: 'white' }}
                          onClick={() => handleDelete(order.id)}
                        >
                          Delete
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
                <button type="submit">Save Changes</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;

//this is test