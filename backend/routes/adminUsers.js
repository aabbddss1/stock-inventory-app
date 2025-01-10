const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt'); // For password hashing
const db = require('../db'); // Your database connection
const authenticate = require('../middleware/authenticate'); // Your authentication middleware
const router = express.Router();

// Add CORS headers middleware if not already added in main app.js
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://37.148.210.169:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Fetch all users
router.get('/', authenticate, (req, res) => {
  const query = 'SELECT id, username, email, role, status FROM users';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json(results);
  });
});

// Add a new user
router.post(
  '/',
  authenticate,
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['Admin', 'Manager', 'Viewer']).withMessage('Invalid role'),
    body('status').isIn(['Active', 'Suspended']).withMessage('Invalid status'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, role, status, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const query = 'INSERT INTO users (username, email, role, status, password) VALUES (?, ?, ?, ?, ?)';
      db.query(query, [username, email, role, status, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error adding user:', err);
          return res.status(500).json({ error: 'Failed to add user' });
        }

        res.status(201).json({
          message: 'User added successfully',
          user: { id: result.insertId, username, email, role, status },
        });
      });
    } catch (err) {
      console.error('Error hashing password:', err);
      res.status(500).json({ error: 'Failed to hash password' });
    }
  }
);

// Update user
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { username, email, role, status } = req.body;

  const query = 'UPDATE users SET username = ?, email = ?, role = ?, status = ? WHERE id = ?';
  db.query(query, [username, email, role, status, id], (err, result) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  });
});

// Delete user
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;
