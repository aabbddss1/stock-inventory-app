const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const customerRoutes = require('./routes/customerRoutes'); // Import routes
const dealershipRoutes = require('./routes/dealershipRoutes');
app.use('/api/dealerships', dealershipRoutes);

const salesRoutes = require('./routes/salesRoutes');
app.use('/api/sales', salesRoutes);



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // To parse JSON request bodies

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Register Routes
app.use('/api/customers', customerRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
