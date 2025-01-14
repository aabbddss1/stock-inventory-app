import React, { useState, useEffect } from 'react';
import axios from 'axios'; // For API calls
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import '../styles/Inventory.css';
import { useTranslation } from 'react-i18next';
import { inventoryTranslation } from '../i18n/inventoryTranslation';

// Set Axios base URL and Authorization header
// axios.defaults.baseURL = 'http://localhost:5001'; // Replace with your backend URL
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

const Inventory = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    price: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  // Fetch products from backend
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      console.log('Fetching inventory...');
      const response = await axios.get('http://37.148.210.169:5001/api/inventory', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Inventory fetched:', response.data);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add or update product
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting product:', formData);

    if (!formData.name || !formData.category || !formData.quantity || !formData.price) {
      console.error('Form data is incomplete');
      return;
    }

    try {
      if (selectedProduct) {
        // Update product
        const response = await axios.put(
          `http://37.148.210.169:5001/api/inventory/${selectedProduct.id}`, 
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        console.log('Product updated:', response.data);
        setProducts(prev => prev.map(product => 
          product.id === selectedProduct.id ? response.data : product
        ));
        setFilteredProducts(prev => prev.map(product => 
          product.id === selectedProduct.id ? response.data : product
        ));
      } else {
        // Add new product
        const response = await axios.post(
          'http://37.148.210.169:5001/api/inventory', 
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        console.log('Product added:', response.data);
        setProducts(prev => [...prev, response.data]);
        setFilteredProducts(prev => [...prev, response.data]);
      }

      setFormData({ name: '', category: '', quantity: '', price: '' });
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response && error.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  // Edit product
  const handleEdit = (product) => {
    console.log('Editing product:', product);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
    });
  };

  // Delete product
  const handleDelete = async (id) => {
    console.log('Deleting product with ID:', id);
    try {
      await axios.delete(`http://37.148.210.169:5001/api/inventory/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProducts(prev => prev.filter(product => product.id !== id));
      setFilteredProducts(prev => prev.filter(product => product.id !== id));
      console.log('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Search functionality
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) ||
        product.category.toLowerCase().includes(value)
    );
    setFilteredProducts(filtered);
  };

  // Export to Excel
  const exportAsExcel = () => {
    const worksheet = XLSXUtils.json_to_sheet(products);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSXWriteFile(workbook, 'inventory_data.xlsx');
    console.log('Inventory exported as Excel');
  };

  // Handle product row click
  const handleProductClick = (product) => {
    setSelectedProductDetails(product);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProductDetails(null);
  };

  return (
    <div className="inventory-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="inventory-container">
          <h1>{t('inventoryTranslation.title')}</h1>

          {/* Search and Export */}
          <div className="inventory-export">
            <input
              type="text"
              placeholder={t('inventoryTranslation.search')}
              value={searchTerm}
              onChange={handleSearch}
            />
            <button onClick={exportAsExcel} className="excel-export-btn">
              <i className="fa fa-th"></i> {t('inventoryTranslation.exportBtn')}
            </button>
          </div>

          {/* Add/Edit Product Form */}
          <form className="inventory-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder={t('inventoryTranslation.form.productName')}
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="category"
              placeholder={t('inventoryTranslation.form.category')}
              value={formData.category}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="quantity"
              placeholder={t('inventoryTranslation.form.quantity')}
              value={formData.quantity}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="price"
              placeholder={t('inventoryTranslation.form.price')}
              value={formData.price}
              onChange={handleChange}
              required
            />
            <button type="submit">
              {selectedProduct ? (
                <>
                  <i className="fa fa-edit"></i> {t('inventoryTranslation.form.updateProduct')}
                </>
              ) : (
                <>
                  <i className="fa fa-plus"></i> {t('inventoryTranslation.form.addProduct')}
                </>
              )}
            </button>
          </form>

          {/* Inventory List Table */}
          <table className="inventory-table">
            <thead>
              <tr>
                <th>{t('inventoryTranslation.table.productName')}</th>
                <th>{t('inventoryTranslation.table.category')}</th>
                <th>{t('inventoryTranslation.table.quantity')}</th>
                <th>{t('inventoryTranslation.table.price')}</th>
                <th>{t('inventoryTranslation.table.status')}</th>
                <th>{t('inventoryTranslation.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr 
                  key={product.id} 
                  onClick={() => handleProductClick(product)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.quantity}</td>
                  <td>${product.price}</td>
                  <td className={`status-cell ${product.status.toLowerCase().replace(/ /g, '-')}`}>
                    {product.status}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div>
                      <button className="inventory-edit-btn" onClick={() => handleEdit(product)}>
                        <i className="fas fa-edit" style={{ marginRight: '5px' }}></i>
                        {t('inventoryTranslation.buttons.edit')}
                      </button>
                      <button className="inventory-delete-btn" onClick={() => handleDelete(product.id)}>
                        <i className="fas fa-trash" style={{ marginRight: '5px' }}></i>
                        {t('inventoryTranslation.buttons.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Product Details Modal */}
          {showModal && selectedProductDetails && (
            <div className="modal-overlay" onClick={handleCloseModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{selectedProductDetails.name}</h2>
                  <button className="modal-close" onClick={handleCloseModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="product-detail">
                    <label>{t('inventoryTranslation.table.category')}:</label>
                    <span>{selectedProductDetails.category}</span>
                  </div>
                  <div className="product-detail">
                    <label>{t('inventoryTranslation.table.quantity')}:</label>
                    <span>{selectedProductDetails.quantity}</span>
                  </div>
                  <div className="product-detail">
                    <label>{t('inventoryTranslation.table.price')}:</label>
                    <span>${selectedProductDetails.price}</span>
                  </div>
                  <div className="product-detail">
                    <label>{t('inventoryTranslation.table.status')}:</label>
                    <span>{selectedProductDetails.status}</span>
                  </div>
                  {/* Add any additional product details you want to display */}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
