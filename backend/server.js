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
const adminUsersRoutes = require('./routes/adminUsers');
const emailRoutes = require('./routes/emailRoutes');
const payableRoutes = require('./routes/payableRoutes');


dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://37.148.210.169:3000', 'http://37.148.210.169'],
  credentials: true
}));

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

// Notifications Endpoint
app.get('/api/notifications', (req, res) => {
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
app.use('/api/admin-users', adminUsersRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/payables', payableRoutes);

// Test Root
app.get('/', (req, res) => {
    res.send('Welcome to the Stock Inventory API!');
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
    console.log('Registered routes:');
    console.log('- /api/auth');
    console.log('- /api/orders');
    console.log('- /api/inventory');
    console.log('- /api/customers');
    console.log('- /api/payables');
});