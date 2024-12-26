const express = require('express');
const router = express.Router();
const db = require('../db'); // MySQL connection
const authenticate = require('../middleware/authenticate'); // Authentication middleware


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

  const status = getStatus(quantity); // Calculate status based on quantity
  const query = `INSERT INTO inventory (name, category, quantity, price, status) VALUES (?, ?, ?, ?, ?)`;

  db.query(query, [name, category, quantity, price, status], (err, result) => {
    if (err) {
      console.error('Error creating inventory item:', err);
      return res.status(500).json({ error: 'Failed to create inventory item' });
    }
    res.status(201).json({ id: result.insertId, name, category, quantity, price, status });
  });
});

// Update an inventory item
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, price } = req.body;

  const status = getStatus(quantity); // Calculate status based on quantity
  const query = `UPDATE inventory SET name = ?, category = ?, quantity = ?, price = ?, status = ? WHERE id = ?`;

  db.query(query, [name, category, quantity, price, status, id], (err, result) => {
    if (err) {
      console.error(`Error updating inventory item with ID ${id}:`, err);
      return res.status(500).json({ error: 'Failed to update inventory item' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ id, name, category, quantity, price, status });
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
