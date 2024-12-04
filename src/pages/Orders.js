// src/pages/Orders.js
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import '../styles/Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      clientName: 'John Doe',
      productName: 'Product A',
      quantity: 2,
      price: 50,
      status: 'Pending',
      documents: [],
    },
    {
      id: 2,
      clientName: 'Jane Smith',
      productName: 'Product B',
      quantity: 1,
      price: 80,
      status: 'On Process',
      documents: [],
    },
  ]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Change order status
  const handleStatusChange = (id, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === id ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
  };

  // Edit order
  const handleEditOrder = (order) => {
    setSelectedOrder(order);
  };

  // Save order changes
  const handleSaveOrder = () => {
    const updatedOrders = orders.map((order) =>
      order.id === selectedOrder.id ? selectedOrder : order
    );
    setOrders(updatedOrders);
    setSelectedOrder(null);
  };

  // Upload files
  const handleFileUpload = (id, files) => {
    const updatedOrders = orders.map((order) =>
      order.id === id ? { ...order, documents: [...order.documents, ...files] } : order
    );
    setOrders(updatedOrders);
    setUploadedFiles([]);
  };

  return (
    <div className="orders-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="orders-container">
          <h1>Orders</h1>

          {/* Orders List Table */}
          <table className="orders-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.clientName}</td>
                  <td>{order.productName}</td>
                  <td>{order.quantity}</td>
                  <td>${order.price}</td>
                  <td>{order.status}</td>
                  <td className="actions-cell">
                    {/* Dropdown for Status Change */}
                    <select
                      className="actions-dropdown"
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Change Status
                      </option>
                      <option value="Approved">Approve</option>
                      <option value="On Process">On Process</option>
                      <option value="Completed">Complete</option>
                    </select>

                    {/* Edit Button */}
                    <button onClick={() => handleEditOrder(order)}>Edit</button>

                    {/* Upload Button */}
                    <label className="upload-button">
                      Upload Files
                      <input
                        id={`file-upload-${order.id}`}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(order.id, [...e.target.files])}
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Edit Order Form */}
          {selectedOrder && (
            <div className="edit-order">
              <h2>Edit Order</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveOrder();
                }}
              >
                <input
                  type="text"
                  value={selectedOrder.clientName}
                  onChange={(e) =>
                    setSelectedOrder({ ...selectedOrder, clientName: e.target.value })
                  }
                  placeholder="Client Name"
                />
                <input
                  type="text"
                  value={selectedOrder.productName}
                  onChange={(e) =>
                    setSelectedOrder({ ...selectedOrder, productName: e.target.value })
                  }
                  placeholder="Product Name"
                />
                <input
                  type="number"
                  value={selectedOrder.quantity}
                  onChange={(e) =>
                    setSelectedOrder({ ...selectedOrder, quantity: e.target.value })
                  }
                  placeholder="Quantity"
                />
                <input
                  type="number"
                  value={selectedOrder.price}
                  onChange={(e) =>
                    setSelectedOrder({ ...selectedOrder, price: e.target.value })
                  }
                  placeholder="Price"
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
