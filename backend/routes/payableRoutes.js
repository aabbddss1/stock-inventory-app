const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middleware/authenticate');

// Debug route - no authentication required
router.get('/test', (req, res) => {
  console.log('Payables test route hit');
  res.json({ message: 'Payables route is working' });
});

// Get all payables
router.get('/', authenticate, (req, res) => {
  console.log('GET /api/payables - Fetching all payables');
  
  const query = `
    SELECT 
      id,
      supplierName,
      invoiceNumber,
      amountOwed,
      DATE_FORMAT(dueDate, '%Y-%m-%d') as dueDate,
      status,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as createdAt
    FROM payables
    ORDER BY dueDate ASC`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch payables',
        details: err.message 
      });
    }
    console.log(`Found ${results.length} payables`);
    res.json(results);
  });
});

// Create new payable
router.post('/', authenticate, (req, res) => {
  console.log('POST /api/payables - Creating new payable:', req.body);
  
  const { supplierName, invoiceNumber, amountOwed, dueDate } = req.body;

  // Validate input
  if (!supplierName || !invoiceNumber || !amountOwed || !dueDate) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['supplierName', 'invoiceNumber', 'amountOwed', 'dueDate'],
      received: req.body 
    });
  }

  const query = `
    INSERT INTO payables (supplierName, invoiceNumber, amountOwed, dueDate, status)
    VALUES (?, ?, ?, ?, 'Pending')`;

  db.query(query, [supplierName, invoiceNumber, amountOwed, dueDate], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Failed to create payable',
        details: err.message 
      });
    }
    console.log('Created new payable with ID:', result.insertId);
    res.status(201).json({ 
      id: result.insertId, 
      ...req.body, 
      status: 'Pending' 
    });
  });
});

// Update payable
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { supplierName, invoiceNumber, amountOwed, dueDate } = req.body;

  const query = `
    UPDATE payables 
    SET supplierName = ?, invoiceNumber = ?, amountOwed = ?, dueDate = ?
    WHERE id = ?`;

  db.query(query, [supplierName, invoiceNumber, amountOwed, dueDate, id], (err, result) => {
    if (err) {
      console.error('Error updating payable:', err);
      return res.status(500).json({ error: 'Failed to update payable' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payable not found' });
    }
    res.json({ message: 'Payable updated successfully' });
  });
});

// Update payable status
router.put('/:id/status', authenticate, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const query = 'UPDATE payables SET status = ? WHERE id = ?';

  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating payable status:', err);
      return res.status(500).json({ error: 'Failed to update payable status' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payable not found' });
    }
    res.json({ message: 'Payable status updated successfully' });
  });
});

// Delete payable
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM payables WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting payable:', err);
      return res.status(500).json({ error: 'Failed to delete payable' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payable not found' });
    }
    res.json({ message: 'Payable deleted successfully' });
  });
});

module.exports = router; 