const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middleware/authenticate');

// Get all admin users
router.get('/', authenticate, async (req, res) => {
  try {
    const query = 'SELECT id, username, email, role, status FROM admin_users';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching admin users:', err);
        return res.status(500).json({ error: 'Failed to fetch admin users' });
      }
      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new admin user
router.post('/', authenticate, async (req, res) => {
  const { username, email, password, role, status } = req.body;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO admin_users (username, email, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [username, email, hashedPassword, role, status],
      (err, result) => {
        if (err) {
          console.error('Error creating admin user:', err);
          return res.status(500).json({ error: 'Failed to create admin user' });
        }
        res.status(201).json({
          id: result.insertId,
          username,
          email,
          role,
          status
        });
      }
    );
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add other admin user routes (update, delete) here...

module.exports = router; 