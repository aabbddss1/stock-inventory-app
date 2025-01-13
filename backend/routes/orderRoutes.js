const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const db = require('../db'); // MySQL connection
const authenticate = require('../middleware/authenticate'); // Authentication middleware
const sendEmail = require('../utils/emailUtils'); // Email utility for sending emails
const PDFDocument = require('pdfkit');
const fs = require('fs');

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

// At the top of the file, add directory checks
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const invoiceDir = path.join(__dirname, '../invoices');
if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir, { recursive: true });
}

// Get all orders
router.get('/', authenticate, (req, res) => {
  const { role, email } = req.user;

  const query =
    role === 'admin'
      ? `SELECT 
          id,
          clientName,
          productName,
          quantity,
          price,
          clientEmail,
          status,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as orderDate 
        FROM orders`
      : `SELECT 
          id,
          clientName,
          productName,
          quantity,
          price,
          clientEmail,
          status,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as orderDate 
        FROM orders 
        WHERE clientEmail = ?`;

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

// Create a new order
router.post('/', authenticate, (req, res) => {
  const { clientEmail, productName, quantity, price } = req.body;

  // Validate input
  if (!clientEmail || !productName || !quantity || !price) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: { clientEmail, productName, quantity, price }
    });
  }

  console.log('Creating order with data:', req.body);

  db.query('SELECT name FROM customers WHERE email = ?', [clientEmail], async (err, results) => {
    if (err) {
      console.error('Error fetching client name:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch client name',
        details: err.message 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'Client not found',
        email: clientEmail 
      });
    }

    const clientName = results[0].name;
    const query = `INSERT INTO orders (
      client_name, 
      clientName, 
      product_name, 
      productName, 
      quantity, 
      price, 
      clientEmail, 
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`;

    db.query(
      query, 
      [
        clientName,    // for client_name
        clientName,    // for clientName
        productName,   // for product_name
        productName,   // for productName
        quantity, 
        price, 
        clientEmail
      ], 
      async (err, result) => {
        if (err) {
          console.error('Error creating order:', err);
          return res.status(500).json({ 
            error: 'Failed to create order',
            details: err.message,
            sqlMessage: err.sqlMessage 
          });
        }

        // Fetch the newly created order with properly formatted date
        const selectQuery = `
          SELECT 
            id,
            clientName,
            productName,
            quantity,
            price,
            clientEmail,
            status,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as orderDate 
          FROM orders 
          WHERE id = ?`;

        db.query(selectQuery, [result.insertId], async (err, results) => {
          if (err) {
            console.error('Error fetching new order:', err);
            return res.status(500).json({ error: 'Order created but failed to fetch details' });
          }

          const orderData = results[0];

          const orderTotal = quantity * price;

          // Generate PDF invoice
          const doc = new PDFDocument();
          const invoicePath = path.join(invoiceDir, `invoice-${result.insertId}.pdf`);
          const writeStream = fs.createWriteStream(invoicePath);
          
          doc.pipe(writeStream);

          // Add content to PDF
          doc.fontSize(20).text('Invoice', { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(`Order ID: ${result.insertId}`);
          doc.text(`Date: ${new Date().toLocaleDateString()}`);
          doc.moveDown();
          doc.text(`Client: ${clientName}`);
          doc.text(`Email: ${clientEmail}`);
          doc.moveDown();
          doc.text('Order Details:');
          doc.moveDown();
          
          // Add table-like structure
          doc.text(`Product: ${productName}`);
          doc.text(`Quantity: ${quantity}`);
          doc.text(`Price per unit: $${price}`);
          doc.text(`Total: $${orderTotal}`);
          
          doc.moveDown();
          doc.text('Thank you for your business!', { align: 'center' });
          
          doc.end();

          // Wait for PDF to finish writing
          await new Promise((resolve) => writeStream.on('finish', resolve));

          // Prepare email content
          const adminEmail = process.env.EMAIL_USER;
          
          const clientEmailBody = `
            <h1 style="font-family: Arial, sans-serif; color: #4CAF50;">New Order Confirmation</h1>
            <p style="font-family: Arial, sans-serif; color: #333;">Dear ${clientName},</p>
            <p style="font-family: Arial, sans-serif; color: #555;">Thank you for your order. Below are your order details:</p>
            <table style="font-family: Arial, sans-serif; border-collapse: collapse; width: 100%; margin-top: 20px;">
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Price Per Unit</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${productName}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$${price}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$${orderTotal}</td>
              </tr>
            </table>
            <p style="font-family: Arial, sans-serif; color: #555; margin-top: 20px;">If you have any questions, please contact us at ${adminEmail}</p>
            <p style="font-family: Arial, sans-serif; color: #333; text-align: center;"><strong>Thank you for choosing Qubite!</strong></p>`;

          const adminEmailBody = `
            <h1 style="font-family: Arial, sans-serif; color: #2196F3;">New Order Received</h1>
            <p style="font-family: Arial, sans-serif; color: #333;">A new order has been placed:</p>
            <table style="font-family: Arial, sans-serif; border-collapse: collapse; width: 100%; margin-top: 20px;">
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px;">Client</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${clientName} (${clientEmail})</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${productName}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$${orderTotal}</td>
              </tr>
            </table>`;

          try {
            // Send emails with invoice attachment
            await sendEmail({
              to: clientEmail,
              subject: 'Order Confirmation - Qubite',
              html: clientEmailBody,
              attachments: [{
                filename: `invoice-${result.insertId}.pdf`,
                path: invoicePath
              }]
            });

            await sendEmail({
              to: adminEmail,
              subject: 'New Order Received',
              html: adminEmailBody,
              attachments: [{
                filename: `invoice-${result.insertId}.pdf`,
                path: invoicePath
              }]
            });

            // Return success response with formatted data from database
            res.status(201).json(orderData);
          } catch (emailError) {
            console.error('Error sending emails:', emailError);
            res.status(201).json({
              ...orderData,
              warning: 'Order created but email notifications failed'
            });
          }
        });
      }
    );
  });
});

// Update order details
router.put('/edit/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { productName, quantity, price } = req.body;

  // Validate input
  if (!productName || !quantity || !price) {
    return res.status(400).json({ error: 'Product name, quantity, and price are required' });
  }

  const query = `UPDATE orders SET productName = ?, quantity = ?, price = ? WHERE id = ?`;

  db.query(query, [productName, quantity, price, id], (err, result) => {
    if (err) {
      console.error(`Error updating order with ID ${id}:`, err);
      return res.status(500).json({ error: 'Failed to update order details' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: `Order with ID ${id} updated successfully` });
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

      const adminEmail = process.env.EMAIL_USER;
      const clientEmailBody = `
        <h1 style="font-family: Arial, sans-serif; color: #4CAF50;">Order Status Update</h1>
        <p style="font-family: Arial, sans-serif; color: #333;">Dear ${clientName},</p>
        <p style="font-family: Arial, sans-serif; color: #555;">The status of your order has been updated. Below are the details:</p>
        <table style="font-family: Arial, sans-serif; border-collapse: collapse; width: 100%; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Order ID</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product Name</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">New Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${id}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${productName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${status}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-family: Arial, sans-serif; color: #555; margin-top: 20px;">If you have questions, contact us at <a href="mailto:${adminEmail}" style="color: #4CAF50; text-decoration: none;">${adminEmail}</a>.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-family: Arial, sans-serif; color: #333; text-align: center;"><strong>Thank you for choosing Qubite!</strong></p>`;

      const adminEmailBody = `
        <h1 style="font-family: Arial, sans-serif; color: #2196F3;">Order Status Updated</h1>
        <p style="font-family: Arial, sans-serif; color: #333;">Hello Admin,</p>
        <p style="font-family: Arial, sans-serif; color: #555;">The status of Order #${id} has been updated. Below are the details:</p>
        <table style="font-family: Arial, sans-serif; border-collapse: collapse; width: 100%; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Order ID</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product Name</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">New Status</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Client Name</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Client Email</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${id}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${productName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${status}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${clientName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${clientEmail}</td>
            </tr>
          </tbody>
        </table>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-family: Arial, sans-serif; color: #333; text-align: center;"><strong>Qubite Admin Team</strong></p>`;

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
