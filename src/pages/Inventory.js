import React, { useState, useEffect } from 'react';
import axios from 'axios'; // For API calls
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile, read as XLSXRead } from 'xlsx'; // For Excel export and read
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
  const [importError, setImportError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  // Add new function to handle Excel import
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    setImportError('');

    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSXRead(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSXUtils.sheet_to_json(worksheet);

        // Validate the data structure
        const isValidData = jsonData.every(item => 
          item.name && item.category && 
          !isNaN(item.quantity) && !isNaN(item.price)
        );

        if (!isValidData) {
          setImportError('Invalid Excel format. Please ensure all required fields are present.');
          return;
        }

        // Send data to backend
        try {
          const response = await axios.post(
            'http://37.148.210.169:5001/api/inventory/bulk-import',
            { products: jsonData },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          );
          
          // Refresh the inventory list
          fetchInventory();
          alert('Products imported successfully!');
        } catch (error) {
          console.error('Error importing products:', error);
          setImportError('Failed to import products. Please try again.');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      setImportError('Error reading Excel file. Please ensure it\'s a valid Excel file.');
    }
  };

  return (
    <div className="inventory-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="inventory-container">
          <h1>{t('inventoryTranslation.title')}</h1>

          {/* Search, Import and Export */}
          <div className="inventory-export">
            <input
              type="text"
              placeholder={t('inventoryTranslation.search')}
              value={searchTerm}
              onChange={handleSearch}
            />
            <div className="excel-buttons">
              <label className="excel-import-btn">
                <i className="fa fa-file-upload"></i> Import Excel
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelImport}
                  style={{ display: 'none' }}
                />
              </label>
              <button onClick={exportAsExcel} className="excel-export-btn">
                <i className="fa fa-file-excel"></i> {t('inventoryTranslation.exportBtn')}
              </button>
            </div>
          </div>
          {importError && <div className="import-error">{importError}</div>}

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
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.quantity}</td>
                  <td>${product.price}</td>
                  <td className={`status-cell ${product.status.toLowerCase().replace(/ /g, '-')}`}>
                    {product.status}
                  </td>
                  <td>
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
        </div>
      </div>
    </div>
  );
};

export default Inventory;
