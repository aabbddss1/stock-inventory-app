import React, { useState, useEffect } from 'react';
import axios from 'axios'; // For API calls
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import '../styles/Inventory.css';

// Set Axios base URL and Authorization header
axios.defaults.baseURL = 'http://localhost:5001'; // Replace with your backend URL
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

const Inventory = () => {
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

  // Fetch products from backend
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      console.log('Fetching inventory...');
      const response = await axios.get('/api/inventory');
      console.log('Inventory fetched:', response.data);
      setProducts(response.data);
      setFilteredProducts(response.data); // Initialize filtered products
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
        const response = await axios.put(`/api/inventory/${selectedProduct.id}`, formData);
        console.log('Product updated:', response.data);

        setProducts((prev) =>
          prev.map((product) =>
            product.id === selectedProduct.id ? response.data : product
          )
        );
        setFilteredProducts((prev) =>
          prev.map((product) =>
            product.id === selectedProduct.id ? response.data : product
          )
        );
      } else {
        // Add new product
        const response = await axios.post('/api/inventory', formData);
        console.log('Product added:', response.data);

        setProducts((prev) => [...prev, response.data]);
        setFilteredProducts((prev) => [...prev, response.data]);
      }

      // Clear form and selected product
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
      await axios.delete(`/api/inventory/${id}`);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      setFilteredProducts((prev) => prev.filter((product) => product.id !== id));
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

  return (
    <div className="inventory-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="inventory-container">
          <h1>Inventory</h1>

          {/* Search and Export */}
          <div className="inventory-actions">
            <input
              type="text"
              placeholder="Search by name or category"
              value={searchTerm}
              onChange={handleSearch}
            />
<button onClick={exportAsExcel} className="excel-export-btn">
  <i className="fa fa-th"></i> Export to Excel
</button>



          </div>

          {/* Add/Edit Product Form */}
          <form className="inventory-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={formData.category}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <button type="submit">
  {selectedProduct ? (
    <>
      <i className="fa fa-edit"></i> Update Product
    </>
  ) : (
    <>
      <i className="fa fa-plus"></i> Add Product
    </>
  )}
</button>

          </form>

          {/* Inventory List Table */}
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.quantity}</td>
                  <td>${product.price}</td>
                  <td>{product.status}</td>
                  <td>
  <div>
    <button className="edit-btn" onClick={() => handleEdit(product)}>
      <i className="fas fa-edit" style={{ marginRight: '5px' }}></i>
      Edit
    </button>
    <button className="delete-btn" onClick={() => handleDelete(product.id)}>
      <i className="fas fa-trash" style={{ marginRight: '5px' }}></i>
      Delete
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
