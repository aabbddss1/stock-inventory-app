const mysql = require('mysql2');

// MySQL Connection Pool
const db = mysql.createPool({
    host: 'customer-db.cr0womsioa46.eu-north-1.rds.amazonaws.com', // AWS RDS endpoint
    user: 'admin',                                                // RDS username
    password: 'Abdussamet1!',                                     // RDS password
    database: 'CustomerManagement',                               // Database name
    waitForConnections: true,                                     // Allow multiple connections
    connectionLimit: 10,                                          // Limit simultaneous connections
    queueLimit: 0                                                 // Unlimited queue
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
