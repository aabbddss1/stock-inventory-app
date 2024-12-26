const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middleware/authenticate');

// Get all sales for admin
router.get('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const query = `
    SELECT sales.*, customers.name AS customer_name, customers.email
    FROM sales
    JOIN customers ON sales.user_id = customers.id
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching sales:', err);
      return res.status(500).json({ error: 'Failed to fetch sales' });
    }
    res.json(results);
  });
});

// Get sales for the logged-in user
router.get('/my-sales', authenticate, (req, res) => {
  const query = 'SELECT * FROM sales WHERE user_id = ?';
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching user sales:', err);
      return res.status(500).json({ error: 'Failed to fetch sales' });
    }
    res.json(results);
  });
});

// Create a new sale
router.post('/', authenticate, (req, res) => {
  const { product_name, quantity, price } = req.body;

  if (!product_name || !quantity || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = 'INSERT INTO sales (user_id, product_name, quantity, price) VALUES (?, ?, ?, ?)';
  db.query(query, [req.user.id, product_name, quantity, price], (err, result) => {
    if (err) {
      console.error('Error creating sale:', err);
      return res.status(500).json({ error: 'Failed to create sale' });
    }
    res.status(201).json({
      id: result.insertId,
      user_id: req.user.id,
      product_name,
      quantity,
      price,
      status: 'Pending',
    });
  });
});

// Update sale status (admin only)
router.put('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const query = 'UPDATE sales SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating sale status:', err);
      return res.status(500).json({ error: 'Failed to update sale status' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json({ message: 'Sale status updated successfully' });
  });
});

module.exports = router;
