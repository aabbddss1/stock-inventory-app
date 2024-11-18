// src/components/Invoices.js
import React, { useState } from 'react';

function Invoices() {
  const [invoices] = useState([
    { id: 1, amount: 1000, date: '2023-11-01' },
    { id: 2, amount: 500, date: '2023-11-05' },
  ]);

  return (
    <div>
      <h2>Invoices</h2>
      <ul>
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            Invoice #{invoice.id} - Amount: ${invoice.amount} - Date: {invoice.date}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Invoices;
