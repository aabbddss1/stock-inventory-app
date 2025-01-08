const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const customerRoutes = require('./routes/customerRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Add the customer routes
app.use('/api/customers', customerRoutes);

// Add the admin routes
app.use('/api/admin-users', adminUserRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
