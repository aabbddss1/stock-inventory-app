// src/components/StockManagement.js
import React, { useState } from 'react';
import '../styles/AdminPanel.css';

function StockManagement() {
  const [stockItems, setStockItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0 });

  const handleAddItem = () => {
    setStockItems([...stockItems, newItem]);
    setNewItem({ name: '', quantity: 0 });
  };

  const handleDeleteItem = (index) => {
    const updatedItems = stockItems.filter((_, i) => i !== index);
    setStockItems(updatedItems);
  };

  return (
    <div className="section">
      <h2>Stock Management</h2>
      <div>
        <input
          type="text"
          placeholder="Item Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={newItem.quantity}
          onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
        />
        <button onClick={handleAddItem}>Add Item</button>
      </div>
      <ul>
        {stockItems.map((item, index) => (
          <li key={index} className="stock-item">
            {item.name} - {item.quantity}
            <button onClick={() => handleDeleteItem(index)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StockManagement;
