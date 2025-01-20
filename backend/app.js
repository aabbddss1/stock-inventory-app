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

// Add the customer routes
app.use('/api/customers', customerRoutes);

// Add the admin routes
app.use('/api/admin-users', adminUserRoutes);

// Add the payable routes
app.use('/api/payables', payableRoutes);

// Serve static files
app.use('/uploads', express.static('/var/www/xcloud-storage/uploads'));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
