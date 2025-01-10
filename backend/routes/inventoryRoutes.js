const express = require('express');
const router = express.Router();
const db = require('../db'); // MySQL connection
const authenticate = require('../middleware/authenticate'); // Authentication middleware

// Add CORS headers middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://37.148.210.169:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Get all inventory items
router.get('/', authenticate, (req, res) => {
  const query = 'SELECT * FROM inventory';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching inventory:', err);
      return res.status(500).json({ error: 'Failed to fetch inventory' });
    }
    res.json(results);
  });
});

// Get a single inventory item by ID
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM inventory WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(`Error fetching inventory item with ID ${id}:`, err);
      return res.status(500).json({ error: 'Failed to fetch inventory item' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(results[0]);
  });
});

// Create a new inventory item
router.post('/', authenticate, (req, res) => {
  const { name, category, quantity, price } = req.body;

  // Validate input
  if (!name || !category || !quantity || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const status = getStatus(parseInt(quantity));
  const query = `INSERT INTO inventory (name, category, quantity, price, status) VALUES (?, ?, ?, ?, ?)`;

  db.query(query, [name, category, parseInt(quantity), parseFloat(price), status], (err, result) => {
    if (err) {
      console.error('Error creating inventory item:', err);
      return res.status(500).json({ error: 'Failed to create inventory item' });
    }

    // Return the created item with all necessary fields
    const createdItem = {
      id: result.insertId,
      name,
      category,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      status
    };

    res.status(201).json(createdItem);
  });
});

// Update an inventory item
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, price } = req.body;

  // Validate input
  if (!name || !category || !quantity || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const status = getStatus(parseInt(quantity));
  const query = `UPDATE inventory SET name = ?, category = ?, quantity = ?, price = ?, status = ? WHERE id = ?`;

  db.query(query, [name, category, parseInt(quantity), parseFloat(price), status, id], (err, result) => {
    if (err) {
      console.error(`Error updating inventory item with ID ${id}:`, err);
      return res.status(500).json({ error: 'Failed to update inventory item' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Return the updated item
    const updatedItem = {
      id: parseInt(id),
      name,
      category,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      status
    };

    res.json(updatedItem);
  });
});

// Delete an inventory item
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM inventory WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(`Error deleting inventory item with ID ${id}:`, err);
      return res.status(500).json({ error: 'Failed to delete inventory item' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted successfully' });
  });
});

// Helper function to calculate status
const getStatus = (quantity) => {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity < 10) return 'Low Stock';
  return 'In Stock';
};

module.exports = router;
