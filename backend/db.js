const mysql = require('mysql2');
require('dotenv').config();




// Update MySQL Connection Pool with new hosting credentials
const db = mysql.createPool({
   host: process.env.DB_HOST,         // Your hosting's MySQL host
   user: process.env.DB_USER,         // Your hosting's MySQL username
   password: process.env.DB_PASSWORD, // Your hosting's MySQL password
   database: process.env.DB_DATABASE, // Database name (CustomerManagement)
   port: process.env.DB_PORT || 3306, // MySQL port (usually 3306)
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0
});




// Test database connection
db.getConnection((err, connection) => {
   if (err) {
       console.error('Error connecting to MySQL database:', err.message);
       process.exit(1);
   } else {
       console.log('Connected to MySQL database successfully');
       connection.release();
   }
});




module.exports = db;
