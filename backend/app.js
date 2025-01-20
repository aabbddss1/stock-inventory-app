const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const customerRoutes = require('./routes/customerRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const path = require('path');
const payableRoutes = require('./routes/payableRoutes');

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Add the customer routes
app.use('/api/customers', customerRoutes);

// Add the admin routes
app.use('/api/admin-users', adminUserRoutes);

// Add the payable routes
app.use('/api/payables', payableRoutes);

// Serve static files
app.use('/uploads', express.static('/var/www/xcloud-storage/uploads'));

// Test route
app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'API is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

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

module.exports = app;
