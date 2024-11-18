// src/components/CurrentOrderStatus.js
import React, { useState } from 'react';

function CurrentOrderStatus() {
  const [currentOrder] = useState({ id: 3, item: 'Tablet', status: 'Shipped' });

  return (
    <div>
      <h2>Current Order Status</h2>
      <p>
        {currentOrder.item} - Status: {currentOrder.status}
      </p>
    </div>
  );
}

export default CurrentOrderStatus;
