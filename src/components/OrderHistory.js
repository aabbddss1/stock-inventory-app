// src/components/OrderHistory.js
import React, { useState } from 'react';

function OrderHistory() {
  const [orderHistory] = useState([
    { id: 1, item: 'Laptop', status: 'Delivered' },
    { id: 2, item: 'Phone', status: 'Delivered' },
  ]);

  return (
    <div>
      <h2>Order History</h2>
      <ul>
        {orderHistory.map((order) => (
          <li key={order.id}>
            {order.item} - Status: {order.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OrderHistory;
