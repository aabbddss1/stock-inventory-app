const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables from .env file

// MySQL Connection Pool
const db = mysql.createPool({
    host: process.env.RDS_HOST,         // Load host from environment variables
    user: process.env.RDS_USER,         // Load user from environment variables
    password: process.env.RDS_PASSWORD, // Load password from environment variables
    database: process.env.RDS_DATABASE, // Load database name from environment variables
    port: process.env.RDS_PORT || 3306, // Default to port 3306 if not specified
    waitForConnections: true,           // Allow multiple connections
    connectionLimit: 10,                // Limit simultaneous connections
    queueLimit: 0                       // Unlimited queue
});

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        process.exit(1); // Exit if connection fails
    } else {
        console.log('Connected to MySQL database successfully');
        connection.release(); // Release the connection
    }
});

module.exports = db;