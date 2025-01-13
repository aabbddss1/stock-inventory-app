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

// Ensure `invoices` directory exists
const invoiceDir = path.join(__dirname, '../invoices');
if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir);
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

  console.log('Received order data:', { clientEmail, productName, quantity, price });

  if (!clientEmail) {
    return res.status(400).json({ error: 'Client email is required' });
  }

  db.query('SELECT name FROM customers WHERE email = ?', [clientEmail], (err, results) => {
    if (err) {
      console.error('Error fetching client name:', err);
      return res.status(500).json({ error: 'Failed to fetch client name' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientName = results[0].name;
    const query = `
      INSERT INTO orders (
        client_name,
        clientName,
        clientEmail,
        productName,
        quantity,
        price,
        status,
        created_at,
        updated_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
    `;

    console.log('Executing query:', query);
    console.log('Query parameters:', [clientName, clientName, clientEmail, productName, quantity, price]);

    db.query(
      query,
      [clientName, clientName, clientEmail, productName, quantity, price],
      async (err, result) => {
        if (err) {
          console.error('Detailed MySQL error:', err);
          return res.status(500).json({ error: 'Failed to create order', details: err.message });
        }

        const selectQuery = `
          SELECT 
            id,
            COALESCE(clientName, client_name) as clientName,
            productName,
            quantity,
            price,
            clientEmail,
            status,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as orderDate 
          FROM orders 
          WHERE id = ?
        `;

        console.log('Executing select query:', selectQuery);
        
        db.query(
          selectQuery,
          [result.insertId],
          async (err, orderResults) => {
            if (err) {
              console.error('Error fetching created order:', err);
              return res.status(500).json({ 
                error: 'Order created but failed to fetch details',
                details: err.message 
              });
            }

            const createdOrder = orderResults[0];
            const orderId = result.insertId;
            const adminEmail = process.env.EMAIL_USER;

            // Generate Invoice
            const invoicePath = `invoices/invoice-${orderId}.pdf`;
            const totalPrice = (quantity * parseFloat(price)).toFixed(2);
            const doc = new PDFDocument();

            doc.pipe(fs.createWriteStream(invoicePath));
            doc.fontSize(20).text('Invoice', { align: 'center' });
            doc.fontSize(14).text(`Order ID: ${orderId}`);
            doc.text(`Date: ${new Date().toLocaleDateString()}`);
            doc.text(`Client Name: ${clientName}`);
            doc.text(`Client Email: ${clientEmail}`);
            doc.text('---------------------------');
            doc.text(`Product: ${productName}`);
            doc.text(`Quantity: ${quantity}`);
            doc.text(`Price per unit: $${parseFloat(price).toFixed(2)}`);
            doc.text(`Total: $${totalPrice}`);
            doc.text('---------------------------');
            doc.text(`Thank you for choosing Qubite!`, { align: 'center' });
            doc.end();

            // Email Content
            const clientEmailBody = `
              <h1 style="font-family: Arial, sans-serif; color: #4CAF50;">Order Confirmation</h1>
              <p style="font-family: Arial, sans-serif; color: #333;">Dear <strong>${clientName}</strong>,</p>
              <p style="font-family: Arial, sans-serif; color: #555;">Thank you for your order! Attached is your invoice for the order:</p>
              <ul style="font-family: Arial, sans-serif; color: #555;">
                <li><strong>Order ID:</strong> ${orderId}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                <li><strong>Product Name:</strong> ${productName}</li>
                <li><strong>Quantity:</strong> ${quantity}</li>
                <li><strong>Total Price:</strong> $${totalPrice}</li>
              </ul>
              <p style="font-family: Arial, sans-serif; color: #555;">If you have any questions, contact us at <a href="mailto:${adminEmail}" style="color: #4CAF50; text-decoration: none;">${adminEmail}</a>.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-family: Arial, sans-serif; color: #333; text-align: center;"><strong>Thank you for choosing Qubite!</strong></p>
            `;

            try {
              // Send emails with invoice attachment
              await sendEmail({
                to: clientEmail,
                subject: `Order Confirmation - Order #${orderId}`,
                html: clientEmailBody,
                attachments: [
                  {
                    filename: `invoice-${orderId}.pdf`,
                    path: invoicePath,
                  },
                ],
              });

              await sendEmail({
                to: adminEmail,
                subject: `New Order Created - Order #${orderId}`,
                html: `<p>A new order has been placed by ${clientName}. Please check the system for more details.</p>`,
                attachments: [
                  {
                    filename: `invoice-${orderId}.pdf`,
                    path: invoicePath,
                  },
                ],
              });

              res.status(201).json(createdOrder); // Send back the complete order with correct date
            } catch (emailError) {
              console.error('Error sending emails:', emailError);
              res.status(500).json({ error: 'Order created, but email notifications failed' });
            }
          }
        );
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
