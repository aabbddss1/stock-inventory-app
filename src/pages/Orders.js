import React, { useState, useEffect } from 'react';
import { api } from '../config/api';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import '../styles/Orders.css';
import { useTranslation } from 'react-i18next';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx';

const Orders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newOrder, setNewOrder] = useState({
    clientEmail: '',
    productName: '',
    quantity: '',
    price: '',
  });

  const token = localStorage.getItem('token');
  const userData = JSON.parse(atob(token.split('.')[1]));
  const userRole = userData.role;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersResponse, usersResponse, inventoryResponse] = await Promise.all([
          api.get('/api/orders'),
          api.get('/api/customers'),
          api.get('/api/inventory')
        ]);

        setOrders(ordersResponse.data);
        setFilteredOrders(ordersResponse.data);
        setUsers(usersResponse.data);
        setInventory(inventoryResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, userRole]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter(order => 
        order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

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

  const exportToExcel = () => {
    const worksheet = XLSXUtils.json_to_sheet(filteredOrders);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSXWriteFile(workbook, 'orders_data.xlsx');
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await api.post('/api/orders', newOrder);
      setOrders([...orders, response.data]);
      setFilteredOrders([...filteredOrders, response.data]);
      setNewOrder({
        clientEmail: '',
        productName: '',
        quantity: '',
        price: '',
      });
      alert('Order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await api.delete(`/api/orders/${id}`);
        setOrders(orders.filter(order => order.id !== id));
        setFilteredOrders(filteredOrders.filter(order => order.id !== id));
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      setFilteredOrders(filteredOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/api/orders/${selectedOrder.id}`, selectedOrder);
      setOrders(orders.map(order =>
        order.id === selectedOrder.id ? selectedOrder : order
      ));
      setFilteredOrders(filteredOrders.map(order =>
        order.id === selectedOrder.id ? selectedOrder : order
      ));
      setSelectedOrder(null);
      alert('Order updated successfully!');
    } catch (error) {
      console.error('Error saving order changes:', error);
      alert('Failed to save changes');
    } finally {
      setActionLoading(false);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="orders-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="orders-container">
          <h1>{t('title')}</h1>

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
                      readOnly
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
                      readOnly
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
                      onClick={() => setSelectedOrder(null)}
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
