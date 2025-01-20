const express = require('express');
const cors = require('cors');
const app = express();

// Import routes
console.log('Importing routes...');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const payableRoutes = require('./routes/payableRoutes');
console.log('Routes imported successfully');

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
console.log('Registering routes...');
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payables', payableRoutes);
console.log('Routes registered successfully');

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Add this right after your middleware setup
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is running',
    routes: {
      payables: typeof payableRoutes !== 'undefined',
      auth: typeof authRoutes !== 'undefined',
      orders: typeof orderRoutes !== 'undefined',
      inventory: typeof inventoryRoutes !== 'undefined',
      customers: typeof customerRoutes !== 'undefined'
    }
  });
});

// Catch-all route for debugging
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      '/api/auth',
      '/api/orders',
      '/api/inventory',
      '/api/customers',
      '/api/payables',
      '/api/test'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;
