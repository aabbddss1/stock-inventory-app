const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const salesRoutes = require('./routes/salesRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminUsersRoutes = require('./routes/adminUsers'); // Import the route
const jwt = require('jsonwebtoken'); // Add this import at the top with other requires
const authenticateToken = require('./middleware/authenticate');


dotenv.config();

// Add JWT secret to your environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Make sure to set this in .env

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies

// Debug Middleware
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Send Email API Endpoint
app.post('/api/send-email', async (req, res) => {
    const { to, subject, text } = req.body;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        });
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Now the notifications route can use authenticateToken
app.get('/api/notifications', authenticateToken, (req, res) => {
    const notifications = [
        { id: 1, message: 'New order received', date: '2024-12-20' },
        { id: 2, message: 'Inventory updated', date: '2024-12-19' },
        { id: 3, message: 'Payment received for Order #1234', date: '2024-12-18' },
    ];
    res.json(notifications);
});

// Register routes
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin-users', adminUsersRoutes); // Register the route
// Test Root
app.get('/', (req, res) => {
    res.send('Welcome to the Stock Inventory API!');
});

// Add login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Add your user verification logic here
  // if (user is verified) {
    const token = jwt.sign(
      { username: username }, 
      JWT_SECRET, 
      { expiresIn: '24h' } // Set token expiration to 24 hours
    );
    res.json({ token });
  // }
});

// 404 Handler
app.use((req, res) => {
    console.error(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Internal Server Error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});