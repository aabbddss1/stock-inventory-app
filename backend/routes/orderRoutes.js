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

// Add CORS headers middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://37.148.210.169:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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
  const { role } = req.user;

  // Only admin or the order owner can delete
  const query = role === 'admin' 
    ? 'DELETE FROM orders WHERE id = ?' 
    : 'DELETE FROM orders WHERE id = ? AND clientEmail = ?';

  const params = role === 'admin' ? [id] : [id, req.user.email];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error(`Error deleting order with ID ${id}:`, err);
      return res.status(500).json({ error: 'Failed to delete order' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found or unauthorized' });
    }

    res.json({ message: `Order with ID ${id} deleted successfully` });
  });
});

// Create a new order
router.post('/', authenticate, (req, res) => {
  const { clientEmail, productName, quantity, price } = req.body;

  console.log('Received order data:', req.body);

  // Validate required fields
  if (!clientEmail || !productName || !quantity || !price) {
    return res.status(400).json({ 
      error: 'All fields are required',
      received: { clientEmail, productName, quantity, price }
    });
  }

  // Get client name from customers table
  db.query(
    'SELECT name FROM customers WHERE email = ?',
    [clientEmail],
    (clientErr, clientResults) => {
      if (clientErr) {
        console.error('Error fetching client:', clientErr);
        return res.status(500).json({ error: 'Failed to fetch client details' });
      }

      if (clientResults.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const clientName = clientResults[0].name;

      // Check inventory
      db.query(
        'SELECT quantity FROM inventory WHERE name = ?',
        [productName],
        (inventoryErr, inventoryResults) => {
          if (inventoryErr) {
            console.error('Error checking inventory:', inventoryErr);
            return res.status(500).json({ error: 'Failed to check inventory' });
          }

          if (inventoryResults.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
          }

          if (inventoryResults[0].quantity < quantity) {
            return res.status(400).json({ 
              error: 'Insufficient inventory',
              available: inventoryResults[0].quantity,
              requested: quantity
            });
          }

          // Create order
          db.query(
            `INSERT INTO orders (clientName, clientEmail, productName, quantity, price, status, created_at) 
             VALUES (?, ?, ?, ?, ?, 'Pending', NOW())`,
            [clientName, clientEmail, productName, quantity, price],
            (orderErr, orderResult) => {
              if (orderErr) {
                console.error('Error creating order:', orderErr);
                return res.status(500).json({ error: 'Failed to create order' });
              }

              // Update inventory
              db.query(
                'UPDATE inventory SET quantity = quantity - ? WHERE name = ?',
                [quantity, productName],
                async (updateErr) => {
                  if (updateErr) {
                    console.error('Error updating inventory:', updateErr);
                    return res.status(500).json({ error: 'Failed to update inventory' });
                  }

                  // Send email notification
                  try {
                    await sendEmail(
                      clientEmail,
                      'Order Confirmation',
                      `Dear ${clientName},\n\nYour order for ${quantity} ${productName}(s) has been received and is being processed.\n\nOrder Details:\nProduct: ${productName}\nQuantity: ${quantity}\nTotal Price: $${price}\n\nThank you for your business!`
                    );
                  } catch (emailErr) {
                    console.error('Error sending email:', emailErr);
                    // Don't return here, continue with the response
                  }

                  // Fetch the created order
                  db.query(
                    `SELECT *, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as orderDate 
                     FROM orders WHERE id = ?`,
                    [orderResult.insertId],
                    (fetchErr, fetchResults) => {
                      if (fetchErr) {
                        console.error('Error fetching created order:', fetchErr);
                        return res.status(500).json({ error: 'Failed to fetch created order' });
                      }

                      res.status(201).json(fetchResults[0]);
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
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


// Update order status
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log('Received status update request:', { id, status });

  // Validate status
  const validStatuses = ['Pending', 'Approved', 'On Process', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status',
      received: status,
      valid: validStatuses 
    });
  }

  // Update the order status
  db.query(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, id],
    async (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error updating order status:', updateErr);
        return res.status(500).json({ error: 'Failed to update order status' });
      }

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Fetch the updated order
      db.query(
        'SELECT * FROM orders WHERE id = ?',
        [id],
        async (selectErr, selectResult) => {
          if (selectErr) {
            console.error('Error fetching updated order:', selectErr);
            return res.status(500).json({ error: 'Failed to fetch updated order' });
          }

          const order = selectResult[0];

          // Send email notification about status change
          try {
            await sendEmail(
              order.clientEmail,
              'Order Status Update',
              `Dear ${order.clientName},\n\nYour order #${order.id} status has been updated to ${status}.\n\nOrder Details:\nProduct: ${order.productName}\nQuantity: ${order.quantity}\nStatus: ${status}\n\nThank you for your business!`
            );
          } catch (emailErr) {
            console.error('Error sending status update email:', emailErr);
            // Continue with the response even if email fails
          }

          res.json({
            message: 'Order status updated successfully',
            order: order
          });
        }
      );
    }
  );
});

module.exports = router;
