import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import axios from 'axios';
import '../styles/Orders.css';
import { useTranslation } from 'react-i18next';
import { ordersTranslation } from '../i18n/ordersTranslation';
import { api } from '../config/api';

const Orders = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]); // For search functionality
  const [searchTerm, setSearchTerm] = useState(''); // Search input state
  const [inventory, setInventory] = useState([]); // Inventory data
  const [users, setUsers] = useState([]); // List of registered users for admin
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // Action-specific loading state
  const [selectedOrder, setSelectedOrder] = useState(null); // For editing orders
  const [newOrder, setNewOrder] = useState({
    clientEmail: '',
    productName: '',
    quantity: '',
    price: '',
  });
  const [sortOrder, setSortOrder] = useState('desc');
  const [quantitySortOrder, setQuantitySortOrder] = useState('desc');

  const token = localStorage.getItem('token');
  const userData = JSON.parse(atob(token.split('.')[1])); // Decode token to get user data
  const userRole = userData.role; // User role (admin or user)

  // Fetch orders, users, and inventory
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders
        const ordersResponse = await axios.get('http://37.148.210.169:5001/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(ordersResponse.data);
        setFilteredOrders(ordersResponse.data);

        // Fetch inventory
        const inventoryResponse = await axios.get('http://37.148.210.169:5001/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventory(inventoryResponse.data);

        // Fetch users for admin
        if (userRole === 'admin') {
          const usersResponse = await axios.get('http://37.148.210.169:5001/api/orders', {
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

    const orderData = userRole === 'admin' ? newOrder : { ...newOrder, clientEmail: userData.email };

    // Check if there's enough inventory
    const selectedProduct = inventory.find(item => item.name === orderData.productName);
    if (!selectedProduct) {
      alert(t('productNotFound'));
      return;
    }

    if (selectedProduct.quantity < orderData.quantity) {
      alert(t('notEnoughInventory'));
      return;
    }

    setActionLoading(true);
    try {
      // Create the order
      const orderResponse = await axios.post('http://37.148.210.169:5001/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update inventory quantity
      const updatedQuantity = selectedProduct.quantity - orderData.quantity;
      await axios.put(`http://37.148.210.169:5001/api/inventory/${selectedProduct.id}`, 
        { ...selectedProduct, quantity: updatedQuantity },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Update local states
      setOrders([...orders, orderResponse.data]);
      setFilteredOrders([...orders, orderResponse.data]);
      setInventory(inventory.map(item => 
        item.id === selectedProduct.id 
          ? { ...item, quantity: updatedQuantity }
          : item
      ));
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
        // Get the order being deleted
        const orderToDelete = orders.find(order => order.id === id);
        
        // Find the corresponding inventory item
        const inventoryItem = inventory.find(item => item.name === orderToDelete.productName);
        
        // Delete the order
        await axios.delete(`http://37.148.210.169:5001/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Return quantity to inventory
        const updatedQuantity = inventoryItem.quantity + parseInt(orderToDelete.quantity);
        await axios.put(`http://37.148.210.169:5001/api/inventory/${inventoryItem.id}`, 
          { ...inventoryItem, quantity: updatedQuantity },
          { headers: { Authorization: `Bearer ${token}` }}
        );

        // Update local states
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
        setFilteredOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
        setInventory(inventory.map(item => 
          item.id === inventoryItem.id 
            ? { ...item, quantity: updatedQuantity }
            : item
        ));

        alert('Order deleted successfully!');
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
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
      await axios.put(`http://37.148.210.169:5001/api/orders/${id}`, updatedOrder, {
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

  // Handle editing an order (pop-up)
  const handleEditOrder = (order) => {
    setSelectedOrder(order);
  };

  // Handle saving changes to an order
  const handleSaveOrder = async (e) => {
    e.preventDefault();

    // Validate selectedOrder data
    if (!selectedOrder.productName || !selectedOrder.quantity || !selectedOrder.price) {
      alert('All fields are required.');
      return;
    }

    setActionLoading(true);
    try {
      // Find the original order to compare quantities
      const originalOrder = orders.find(order => order.id === selectedOrder.id);
      const quantityDifference = selectedOrder.quantity - originalOrder.quantity;

      // Find the corresponding inventory item
      const inventoryItem = inventory.find(item => item.name === selectedOrder.productName);

      // Check if there's enough inventory for the quantity increase
      if (quantityDifference > 0 && inventoryItem.quantity < quantityDifference) {
        alert('Not enough inventory available for this quantity increase!');
        return;
      }

      // Update the order
      await axios.put(`http://37.148.210.169:5001/api/orders/edit/${selectedOrder.id}`, selectedOrder, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update inventory quantity
      const updatedQuantity = inventoryItem.quantity - quantityDifference;
      await axios.put(`http://37.148.210.169:5001/api/inventory/${inventoryItem.id}`, 
        { ...inventoryItem, quantity: updatedQuantity },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Update local states
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === selectedOrder.id ? { ...order, ...selectedOrder } : order
        )
      );
      setFilteredOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === selectedOrder.id ? { ...order, ...selectedOrder } : order
        )
      );
      setInventory(inventory.map(item => 
        item.id === inventoryItem.id 
          ? { ...item, quantity: updatedQuantity }
          : item
      ));

      setSelectedOrder(null); // Close edit form
      alert('Order updated successfully!');
    } catch (error) {
      console.error('Error saving order changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    const sorted = [...filteredOrders].sort((a, b) => {
      return newOrder === 'desc' 
        ? new Date(b.orderDate) - new Date(a.orderDate)
        : new Date(a.orderDate) - new Date(b.orderDate);
    });
    setFilteredOrders(sorted);
  };

  const toggleQuantitySort = () => {
    const newOrder = quantitySortOrder === 'desc' ? 'asc' : 'desc';
    setQuantitySortOrder(newOrder);
    const sorted = [...filteredOrders].sort((a, b) => {
      return newOrder === 'desc' 
        ? b.quantity - a.quantity
        : a.quantity - b.quantity;
    });
    setFilteredOrders(sorted);
  };

  return (
    <div className="orders-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="orders-container">
          <h1>{t('title')}</h1>

          {/* Search and Export Actions */}
          <div className="orders-export">
            <input
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={handleSearch}
            />
            <button onClick={exportToExcel}>
              <i className="fa fa-th"></i> {t('exportButton')}
            </button>
          </div>

          {/* Create Order Form */}
          <div className="create-order-form">
            <h2>{t('createOrder')}</h2>
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
                    <option value="">{t('selectUser')}</option>
                    {users.map((user) => (
                      <option key={user.email} value={user.email}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-row">
                <select
                  value={newOrder.productName}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      productName: e.target.value,
                      price:
                        inventory.find((item) => item.name === e.target.value)
                          ?.price || '',
                    })
                  }
                  required
                >
                  <option value="">{t('selectProduct')}</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({t('stock')} {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <input
                  type="number"
                  placeholder={t('quantity')}
                  value={newOrder.quantity}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, quantity: e.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  placeholder={t('price')}
                  value={newOrder.price}
                  readOnly
                  required
                />
              </div>
              <button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <i className="fa fa-spinner fa-spin"></i> {t('processing')}
                  </>
                ) : (
                  <>
                    <i className="fa fa-plus"></i> {t('createOrderButton')}
                  </>
                )}
              </button>
            </form>
          </div>

          {loading ? (
            <p>{t('loading')}</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>{t('clientName')}</th>
                  <th>{t('productName')}</th>
                  <th>{t('date')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('price')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={userRole === 'admin' ? (e) => {
                      if (!e.target.closest('select') && !e.target.closest('button')) {
                        handleEditOrder(order);
                      }
                    } : undefined}
                    style={{ cursor: userRole === 'admin' ? 'pointer' :'default' }}
                    className={userRole === 'admin' ? 'order-row' :''}
                  >
                    <td>{order.clientName}</td>
                    <td>{order.productName}</td>
                    <td>{order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}</td>
                    <td>{order.quantity}</td>
                    <td>${order.price}</td>
                    <td>
                      {userRole === 'admin' ? (
                        <select
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order.id, e.target.value);
                          }}
                          value={order.status}
                          disabled={actionLoading}
                        >
                          <option value="Pending">{t('pending')}</option>
                          <option value="Approved">{t('approved')}</option>
                          <option value="On Process">{t('onProcess')}</option>
                          <option value="Completed">{t('completed')}</option>
                        </select>
                      ) : (
                        order.status
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="edit-order-btn"
                        onClick={() => handleEditOrder(order)}
                        disabled={userRole !== 'admin' && order.status !== 'Pending'}
                      >
                        <i className="fas fa-edit" style={{ marginRight: '5px' }}></i>
                        {t('edit')}
                      </button>
                      <button
                        className="delete-order-btn"
                        onClick={() => handleDelete(order.id)}
                        disabled={userRole !== 'admin' && order.status !== 'Pending'}
                      >
                        <i className="fas fa-trash" style={{ marginRight:'5px' }}></i>
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedOrder && (
            <div className="edit-order-modal">
              <div className="edit-order-modal-content">
                <h2>{t('editOrder')}</h2>
                <form onSubmit={handleSaveOrder} className="edit-order-form">
                  <div className="edit-order-input-container">
                    <label htmlFor="productName">{t('orderName')}</label>
                    <input
                      id="productName"
                      type="text"
                      value={selectedOrder.productName}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          productName: e.target.value,
                        })
                      }
                      placeholder={t('orderName')}
                      required
                      className="edit-order-input"
                      readOnly // Değiştirilemez yapıldı
                    />
                  </div>
                  <div className="edit-order-input-container">
                    <label htmlFor="quantity">{t('quantity')}</label>
                    <input
                      id="quantity"
                      type="number"
                      value={selectedOrder.quantity}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          quantity: e.target.value,
                        })
                      }
                      placeholder={t('quantity')}
                      required
                      className="edit-order-input"
                    />
                  </div>
                  <div className="edit-order-input-container">
                    <label htmlFor="price">{t('price')}</label>
                    <input
                      id="price"
                      type="number"
                      value={selectedOrder.price}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          price: e.target.value,
                        })
                      }
                      placeholder={t('price')}
                      required
                      className="edit-order-input"
                      readOnly // Değiştirilemez yapıldı
                    />
                  </div>
                  <div className="edit-order-button-container">
                    <button type="submit" disabled={actionLoading} className="order-modal-save-button">
                      {actionLoading ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i> {t('saving')}
                        </>
                      ) : (
                        <>
                          <i className="fa fa-save"></i> {t('saveChanges')}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)} // Close the modal
                      className="order-modal-cancel-button"
                    >
                      <i className="fa fa-times"></i> {t('cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
