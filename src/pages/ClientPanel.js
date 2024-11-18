// src/pages/ClientPanel.js
import React from 'react';
import OrderHistory from '../components/OrderHistory';
import CurrentOrderStatus from '../components/CurrentOrderStatus';
import Invoices from '../components/Invoices';

function ClientPanel() {
  return (
    <div>
      <h1>Client Panel</h1>
      <OrderHistory />
      <CurrentOrderStatus />
      <Invoices />
      {/* Additional features can go here */}
    </div>
  );
}

export default ClientPanel;
