// src/components/OrderManagement.js
import React, { useState } from 'react';
import '../styles/AdminPanel.css';

function OrderManagement() {
  const [orders, setOrders] = useState([
    { id: 1, item: 'Laptop', status: 'Pending' },
    { id: 2, item: 'Phone', status: 'Shipped' },
  ]);

  const handleStatusChange = (id, newStatus) => {
    setOrders(
      orders.map((order) => (order.id === id ? { ...order, status: newStatus } : order))
    );
  };

  return (
    <div className="section">
      <h2>Order Management</h2>
      <ul>
        {orders.map((order) => (
          <li key={order.id} className="order-item">
            {order.item} - Status:
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(order.id, e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OrderManagement;
