const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer'); // Import Nodemailer
const customerRoutes = require('./routes/customerRoutes'); // Import customer routes
const orderRoutes = require('./routes/orderRoutes'); // Import order routes
const salesRoutes = require('./routes/salesRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes'); // Import inventory routes

dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON request bodies

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your preferred email service
  auth: {
    user: process.env.EMAIL_USER, // Environment variable for email
    pass: process.env.EMAIL_PASS, // Environment variable for email password
  },
});

// Send Email API Endpoint
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email
      to, // Receiver email
      subject, // Email subject
      text, // Email content
    };

    await transporter.sendMail(mailOptions); // Send the email
    console.log(`Email sent to ${to}`);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Notifications Endpoint (Mock Data Example)
app.get('/api/notifications', (req, res) => {
  const notifications = [
    { id: 1, message: 'New order received', date: '2024-12-20' },
    { id: 2, message: 'Inventory updated', date: '2024-12-19' },
    { id: 3, message: 'Payment received for Order #1234', date: '2024-12-18' },
  ];
  res.json(notifications);
});

// Register customer, order, sales, and inventory routes
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);

// Root route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the Stock Inventory API!');
});

// Handle undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Define the port
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
