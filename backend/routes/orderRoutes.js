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
          paymentStatus,
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
          paymentStatus,
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
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { padding: 20px; background: #fff; border: 1px solid #ddd; }
                .footer { background: #f8f8f8; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; }
                .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .table th { background: #f5f5f5; }
                .highlight { color: #4CAF50; font-weight: bold; }
                .info-box { background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">Order Confirmation</h1>
                  <p style="margin: 10px 0 0 0;">Thank you for choosing Qubite!</p>
                </div>
                <div class="content">
                  <p>Dear <span class="highlight">${clientName}</span>,</p>
                  <p>We're excited to confirm that your order has been successfully placed. Here are your order details:</p>
                  
                  <div class="info-box">
                    <p><strong>Order ID:</strong> #${result.insertId}</p>
                    <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Status:</strong> <span class="highlight">Pending</span></p>
                  </div>

                  <table class="table">
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price Per Unit</th>
                      <th>Total</th>
                    </tr>
                    <tr>
                      <td>${productName}</td>
                      <td>${quantity}</td>
                      <td>$${price.toFixed(2)}</td>
                      <td>$${orderTotal.toFixed(2)}</td>
                    </tr>
                  </table>

                  <div class="info-box">
                    <h3 style="margin-top: 0;">What's Next?</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li>You'll receive updates about your order status</li>
                      <li>An invoice is attached to this email</li>
                      <li>Our team will process your order shortly</li>
                    </ul>
                  </div>

                  <p>If you have any questions about your order, please don't hesitate to contact our support team at <a href="mailto:${adminEmail}" style="color: #4CAF50;">${adminEmail}</a></p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Qubite. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>`;

          const adminEmailBody = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { padding: 20px; background: #fff; border: 1px solid #ddd; }
                .footer { background: #f8f8f8; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; }
                .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .table th { background: #f5f5f5; }
                .highlight { color: #2196F3; font-weight: bold; }
                .info-box { background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
                .alert { background: #e3f2fd; padding: 10px; margin: 10px 0; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">New Order Received</h1>
                  <p style="margin: 10px 0 0 0;">Order #${result.insertId}</p>
                </div>
                <div class="content">
                  <div class="alert">
                    <p><strong>Action Required:</strong> Please review and process this new order.</p>
                  </div>

                  <div class="info-box">
                    <h3 style="margin-top: 0;">Order Details</h3>
                    <p><strong>Order ID:</strong> #${result.insertId}</p>
                    <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Status:</strong> Pending</p>
                  </div>

                  <div class="info-box">
                    <h3 style="margin-top: 0;">Customer Information</h3>
                    <p><strong>Name:</strong> ${clientName}</p>
                    <p><strong>Email:</strong> ${clientEmail}</p>
                  </div>

                  <table class="table">
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price Per Unit</th>
                      <th>Total</th>
                    </tr>
                    <tr>
                      <td>${productName}</td>
                      <td>${quantity}</td>
                      <td>$${price.toFixed(2)}</td>
                      <td>$${orderTotal.toFixed(2)}</td>
                    </tr>
                  </table>

                  <p>Please process this order according to our standard procedures. The invoice has been automatically generated and is attached to this email.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Qubite Admin System</p>
                </div>
              </div>
            </body>
            </html>`;

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
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; background: #fff; border: 1px solid #ddd; }
            .footer { background: #f8f8f8; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background: #f5f5f5; }
            .highlight { color: #4CAF50; font-weight: bold; }
            .info-box { background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Order Status Update</h1>
              <p style="margin: 10px 0 0 0;">Order #${id}</p>
            </div>
            <div class="content">
              <p>Dear <span class="highlight">${clientName}</span>,</p>
              <p>We're writing to inform you that there has been an update to your order.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">Status Update Details</h3>
                <p><strong>Order ID:</strong> #${id}</p>
                <p><strong>Update Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>New Status:</strong> 
                  <span class="status-badge" style="background: ${
                    status === 'Completed' ? '#4CAF50' : 
                    status === 'Processing' ? '#2196F3' : 
                    status === 'Cancelled' ? '#f44336' : 
                    status === 'On Hold' ? '#ff9800' : 
                    '#9e9e9e'
                  }; color: white;">
                    ${status}
                  </span>
                </p>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${productName}</td>
                    <td>${status}</td>
                  </tr>
                </tbody>
              </table>

              <div class="info-box">
                <h3 style="margin-top: 0;">What This Means</h3>
                <p>${
                  status === 'Completed' ? 'Your order has been successfully completed and delivered.' :
                  status === 'Processing' ? 'Your order is currently being processed and prepared for delivery.' :
                  status === 'Cancelled' ? 'Your order has been cancelled. If you did not request this cancellation, please contact us immediately.' :
                  status === 'On Hold' ? 'Your order has been placed on hold. We will contact you if we need any additional information.' :
                  'Your order status has been updated.'
                }</p>
              </div>

              <p>If you have any questions about this update, please don't hesitate to contact us at <a href="mailto:${adminEmail}" style="color: #4CAF50;">${adminEmail}</a></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Qubite. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>`;

      const adminEmailBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; background: #fff; border: 1px solid #ddd; }
            .footer { background: #f8f8f8; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background: #f5f5f5; }
            .highlight { color: #2196F3; font-weight: bold; }
            .info-box { background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Order Status Changed</h1>
              <p style="margin: 10px 0 0 0;">Order #${id}</p>
            </div>
            <div class="content">
              <div class="info-box">
                <h3 style="margin-top: 0;">Status Update Information</h3>
                <p><strong>Order ID:</strong> #${id}</p>
                <p><strong>Update Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>New Status:</strong> 
                  <span class="status-badge" style="background: ${
                    status === 'Completed' ? '#4CAF50' : 
                    status === 'Processing' ? '#2196F3' : 
                    status === 'Cancelled' ? '#f44336' : 
                    status === 'On Hold' ? '#ff9800' : 
                    '#9e9e9e'
                  }; color: white;">
                    ${status}
                  </span>
                </p>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">Customer Information</h3>
                <p><strong>Name:</strong> ${clientName}</p>
                <p><strong>Email:</strong> ${clientEmail}</p>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product Name</th>
                    <th>Previous Status</th>
                    <th>New Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#${id}</td>
                    <td>${productName}</td>
                    <td>${order.status}</td>
                    <td>${status}</td>
                  </tr>
                </tbody>
              </table>

              <div class="info-box">
                <h3 style="margin-top: 0;">Required Actions</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  ${
                    status === 'Completed' ? '<li>Verify all delivery confirmations are received</li><li>Update inventory records</li>' :
                    status === 'Processing' ? '<li>Begin order fulfillment process</li><li>Check inventory availability</li>' :
                    status === 'Cancelled' ? '<li>Process any necessary refunds</li><li>Update inventory if necessary</li>' :
                    status === 'On Hold' ? '<li>Review reason for hold</li><li>Contact customer if necessary</li>' :
                    '<li>Review order details</li>'
                  }
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Qubite Admin System</p>
            </div>
          </div>
        </body>
        </html>`;

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

// Update payment status
router.put('/:id/payment-status', authenticate, (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  const query = `UPDATE orders SET paymentStatus = ? WHERE id = ?`;

  db.query(query, [paymentStatus, id], (err, result) => {
    if (err) {
      console.error(`Error updating payment status for order ID ${id}:`, err);
      return res.status(500).json({ error: 'Failed to update payment status' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: `Payment status updated successfully for order ID ${id}` });
  });
});

module.exports = router;
