const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db'); // Import the database connection
const authenticate = require('../middleware/authenticate'); // Middleware for JWT authentication
const sendEmail = require('../utils/emailUtils'); // Bu satırın eklendiğinden emin olun

// Middleware for admin check
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

router.get('/example', authenticate, (req, res) => {
  res.json({ message: 'Authenticated route accessed' });
});

// Customer Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const query = 'SELECT * FROM customers WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Error fetching customer:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customer' });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const customer = results[0];

    const isValidPassword = await bcrypt.compare(password, customer.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login time
    const updateQuery = 'UPDATE customers SET lastLoggedIn = ? WHERE id = ?';
    const currentTime = new Date().toISOString();
    
    db.query(updateQuery, [currentTime, customer.id], (updateErr) => {
      if (updateErr) {
        console.error('Error updating last login time:', updateErr);
        // Continue with login process even if update fails
      }
    });

    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: customer.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token, role: customer.role });
  });
});

// Get the logged-in user's details
router.get('/me', authenticate, (req, res) => {
  const { id } = req.user;
  db.query(
    'SELECT id, name, email, phone, lastLoggedIn FROM customers WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('Error fetching user details:', err.message);
        return res.status(500).json({ error: 'Failed to fetch user details' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(results[0]);
    }
  );
});

// Get all customers (Admin only)
router.get('/', authenticate, requireAdmin, (req, res) => {
  db.query('SELECT id, name, email, phone, role FROM customers', (err, results) => {
    if (err) {
      console.error('Error fetching customers:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
    res.json(results);
  });
});

// Get a single customer by ID (Admin or the customer themselves)
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin' && req.user.id !== parseInt(id, 10)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.query('SELECT id, name, email, phone FROM customers WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error(`Error fetching customer with ID ${id}:`, err.message);
      return res.status(500).json({ error: 'Failed to fetch customer' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(results[0]);
  });
});

// Add a new customer (Admin only)
router.post('/', authenticate, async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Validate input fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert customer into the database
    db.query(
      'INSERT INTO customers (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, role],
      async (err, result) => {
        if (err) {
          console.error('Error adding customer:', err.message);
          return res.status(500).json({ error: 'Failed to add customer' });
        }

        // Prepare email content
        const adminEmail = process.env.EMAIL_USER;
        
        const welcomeEmailBody = `
          <h1 style="font-family: Arial, sans-serif; color: #4CAF50;">Welcome to Qubite Stock Management</h1>
          <p style="font-family: Arial, sans-serif; color: #333;">Dear ${name},</p>
          <p style="font-family: Arial, sans-serif; color: #555;">Welcome to Qubite Stock Management System! Your account has been created successfully.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Your Login Details:</strong></p>
            <p style="margin: 5px 0;">Email: ${email}</p>
            <p style="margin: 5px 0;">Password: ${password}</p>
          </div>
          <p style="font-family: Arial, sans-serif; color: #555;">Please keep these credentials safe and change your password after your first login.</p>
          <p style="font-family: Arial, sans-serif; color: #555;">If you have any questions, please contact us at ${adminEmail}</p>
          <p style="font-family: Arial, sans-serif; color: #333; text-align: center;"><strong>Thank you for choosing Qubite!</strong></p>`;

        const adminNotificationBody = `
          <h1 style="font-family: Arial, sans-serif; color: #2196F3;">New Customer Account Created</h1>
          <p style="font-family: Arial, sans-serif; color: #333;">A new customer account has been created:</p>
          <table style="font-family: Arial, sans-serif; border-collapse: collapse; width: 100%; margin-top: 20px;">
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px;">Name</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Email</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Phone</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Role</th>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${name}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${email}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${phone || 'N/A'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${role}</td>
            </tr>
          </table>`;

        try {
          // Send welcome email to customer
          await sendEmail({
            to: email,
            subject: 'Welcome to Qubite Stock Management',
            html: welcomeEmailBody
          });

          // Send notification to admin
          await sendEmail({
            to: adminEmail,
            subject: 'New Customer Account Created',
            html: adminNotificationBody
          });

          res.status(201).json({
            id: result.insertId,
            name,
            email,
            phone,
            role,
          });
        } catch (emailError) {
          console.error('Error sending emails:', emailError);
          // Still return success but with a warning
          res.status(201).json({
            id: result.insertId,
            name,
            email,
            phone,
            role,
            warning: 'Customer created but email notifications failed'
          });
        }
      }
    );
  } catch (err) {
    console.error('Error hashing password:', err.message);
    res.status(500).json({ error: 'Failed to process customer data' });
  }
});


// Update a customer (Admin only or the customer themselves)
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const query = hashedPassword
      ? 'UPDATE customers SET name = ?, email = ?, phone = ?, password = ?, role = ? WHERE id = ?'
      : 'UPDATE customers SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?';

    const params = hashedPassword
      ? [name, email, phone, hashedPassword, role, id]
      : [name, email, phone, role, id];

    db.query(query, params, (err, result) => {
      if (err) {
        console.error(`Error updating customer with ID ${id}:`, err.message);
        return res.status(500).json({ error: 'Failed to update customer' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json({ id, name, email, phone, role });
    });
  } catch (err) {
    console.error('Error updating customer:', err.message);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});


// Delete a customer (Admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM customers WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error(`Error deleting customer with ID ${id}:`, err.message);
      return res.status(500).json({ error: 'Failed to delete customer' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully', id });
  });
});

module.exports = router;