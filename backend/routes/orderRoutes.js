const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const db = require('../db'); // MySQL connection
const authenticate = require('../middleware/authenticate'); // Authentication middleware
const sendEmail = require('../utils/emailUtils'); // Email utility for sending emails

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure the `uploads` directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Get all orders
router.get('/', authenticate, (req, res) => {
  const { role, email } = req.user;

  const query =
    role === 'admin'
      ? 'SELECT * FROM orders'
      : 'SELECT * FROM orders WHERE clientEmail = ?';

  const params = role === 'admin' ? [] : [email];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(results);
  });
});

// Delete an order
router.delete('/:id', authenticate, (req, res) => {
    const { id } = req.params;
  
    const query = 'DELETE FROM orders WHERE id = ?';
  
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error(`Error deleting order with ID ${id}:`, err);
        return res.status(500).json({ error: 'Failed to delete order' });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      res.json({ message: `Order with ID ${id} deleted successfully` });
    });
  });

  
  router.post('/', authenticate, (req, res) => {
    const { clientEmail, productName, quantity, price } = req.body;
  
    // Check if clientEmail is provided in the request body
    if (!clientEmail) {
      return res.status(400).json({ error: 'Client email is required' });
    }
  
    // Fetch client details based on the provided clientEmail
    db.query('SELECT name FROM customers WHERE email = ?', [clientEmail], (err, results) => {
      if (err) {
        console.error('Error fetching client name:', err);
        return res.status(500).json({ error: 'Failed to fetch client name' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }
  
      const clientName = results[0].name;
  
      // Insert the order into the database
      const query = `INSERT INTO orders (clientName, productName, quantity, price, clientEmail) VALUES (?, ?, ?, ?, ?)`;
      db.query(query, [clientName, productName, quantity, price, clientEmail], async (err, result) => {
        if (err) {
          console.error('Error creating order:', err);
          return res.status(500).json({ error: 'Failed to create order' });
        }
  
        const orderId = result.insertId;
  
        // Prepare email content
        const adminEmail = process.env.EMAIL_USER;
        const clientEmailBody = `
          <h1>Order Confirmation</h1>
          <p>Dear ${clientName},</p>
          <p>Thank you for placing an order with us. Here are your order details:</p>
          <table border="1" cellpadding="5" cellspacing="0">
            <tr><th>Order ID</th><td>${orderId}</td></tr>
            <tr><th>Product Name</th><td>${productName}</td></tr>
            <tr><th>Quantity</th><td>${quantity}</td></tr>
            <tr><th>Total Price</th><td>$${price}</td></tr>
          </table>
          <p>Your order has been successfully created and is now being processed.</p>
          <p>If you have any questions, please contact us at <a href="mailto:${adminEmail}">${adminEmail}</a>.</p>
          <hr>
          <p><strong>Thank you for choosing Qubite!</strong></p>
        `;
  
        const adminEmailBody = `
          <h1>New Order Created</h1>
          <p>An order has been placed on behalf of ${clientName}. Here are the details:</p>
          <table border="1" cellpadding="5" cellspacing="0">
            <tr><th>Order ID</th><td>${orderId}</td></tr>
            <tr><th>Product Name</th><td>${productName}</td></tr>
            <tr><th>Quantity</th><td>${quantity}</td></tr>
            <tr><th>Total Price</th><td>$${price}</td></tr>
            <tr><th>Client Email</th><td>${clientEmail}</td></tr>
          </table>
          <p>Please ensure the order is processed promptly.</p>
          <hr>
          <p><strong>Qubite Admin Team</strong></p>
        `;
  
        try {
          // Send emails
          await sendEmail({ to: clientEmail, subject: `Order Confirmation - Order #${orderId}`, html: clientEmailBody });
          await sendEmail({ to: adminEmail, subject: `New Order Created - Order #${orderId}`, html: adminEmailBody });
  
          res.status(201).json({ id: orderId, clientName, productName, quantity, price, clientEmail });
        } catch (emailError) {
          console.error('Error sending emails:', emailError);
          res.status(500).json({ error: 'Order created, but email notifications failed' });
        }
      });
    });
  });

// Update an order status
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const query = `UPDATE orders SET status = ? WHERE id = ?`;

  db.query(query, [status, id], async (err, result) => {
    if (err) {
      console.error(`Error updating order status for ID ${id}:`, err);
      return res.status(500).json({ error: 'Failed to update order status' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.query('SELECT * FROM orders WHERE id = ?', [id], async (err, results) => {
      if (err || results.length === 0) {
        console.error('Error fetching order details:', err);
        return res.status(500).json({ error: 'Failed to fetch order details' });
      }

      const order = results[0];
      const clientEmail = order.clientEmail;
      const clientName = order.clientName;
      const productName = order.productName;

      // Email content
      const adminEmail = process.env.EMAIL_USER;
      const clientEmailBody = `
        <h1>Order Status Update</h1>
        <p>Dear ${clientName},</p>
        <p>The status of your order has been updated. Here are the details:</p>
        <table border="1" cellpadding="5" cellspacing="0">
          <tr><th>Order ID</th><td>${id}</td></tr>
          <tr><th>Product Name</th><td>${productName}</td></tr>
          <tr><th>New Status</th><td>${status}</td></tr>
        </table>
        <p>If you have any questions, please contact us at <a href="mailto:${adminEmail}">${adminEmail}</a>.</p>
        <hr>
        <p><strong>Thank you for choosing Qubite!</strong></p>
      `;

      const adminEmailBody = `
        <h1>Order Status Updated</h1>
        <p>The status of Order #${id} has been updated. Here are the details:</p>
        <table border="1" cellpadding="5" cellspacing="0">
          <tr><th>Order ID</th><td>${id}</td></tr>
          <tr><th>Product Name</th><td>${productName}</td></tr>
          <tr><th>New Status</th><td>${status}</td></tr>
          <tr><th>Client Name</th><td>${clientName}</td></tr>
          <tr><th>Client Email</th><td>${clientEmail}</td></tr>
        </table>
        <p>Please ensure all necessary follow-up actions are taken.</p>
        <hr>
        <p><strong>Qubite Admin Team</strong></p>
      `;

      try {
        await sendEmail({ to: clientEmail, subject: `Order Status Updated - Order #${id}`, html: clientEmailBody });
        await sendEmail({ to: adminEmail, subject: `Order Status Updated - Order #${id}`, html: adminEmailBody });
        res.json({ id, status });
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        res.status(500).json({ error: 'Order status updated, but email notifications failed' });
      }
    });
  });
});

module.exports = router;
