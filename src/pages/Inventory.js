// src/pages/Inventory.js
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import jsPDF from 'jspdf'; // For PDF export
import '../styles/Inventory.css';

const Inventory = () => {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Product A',
      category: 'Electronics',
      quantity: 50,
      price: 200,
      status: 'In Stock',
    },
    {
      id: 2,
      name: 'Product B',
      category: 'Furniture',
      quantity: 5,
      price: 500,
      status: 'Low Stock',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    price: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add or update product
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedProduct) {
      // Update product
      const updatedProducts = products.map((product) =>
        product.id === selectedProduct.id
          ? { ...formData, id: product.id, status: getStatus(formData.quantity) }
          : product
      );
      setProducts(updatedProducts);
      setSelectedProduct(null);
    } else {
      // Add new product
      const newProduct = {
        ...formData,
        id: Date.now(),
        status: getStatus(formData.quantity),
      };
      setProducts([...products, newProduct]);
    }

    setFormData({ name: '', category: '', quantity: '', price: '' });
  };

  // Edit product
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
    });
  };

  // Delete product
  const handleDelete = (id) => {
    const updatedProducts = products.filter((product) => product.id !== id);
    setProducts(updatedProducts);
  };

  // Get product status based on quantity
  const getStatus = (quantity) => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    return 'In Stock';
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
  };

  // Export to PDF
  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.text('Inventory Report', 10, 10);
    let yPosition = 20;

    products.forEach((product, index) => {
      doc.text(`${index + 1}. ${product.name} - ${product.category}`, 10, yPosition);
      doc.text(
        `   Quantity: ${product.quantity}, Price: $${product.price}, Status: ${product.status}`,
        10,
        yPosition + 10
      );
      yPosition += 20;
    });

    doc.save('inventory_report.pdf');
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
            <button onClick={exportAsExcel}>Export as Excel</button>
            <button onClick={exportAsPDF}>Export as PDF</button>
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
            <button type="submit">{selectedProduct ? 'Update Product' : 'Add Product'}</button>
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
                    <button onClick={() => handleEdit(product)}>Edit</button>
                    <button onClick={() => handleDelete(product.id)}>Delete</button>
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
