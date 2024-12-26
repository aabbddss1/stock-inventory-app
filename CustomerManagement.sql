-- Step 1: Create the database (if not already created)
CREATE DATABASE IF NOT EXISTS CustomerManagement;

-- Step 2: Switch to the new database
USE CustomerManagement;

-- Step 3: Create the customers table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- Unique ID for each customer
    name VARCHAR(255) NOT NULL,                 -- Customer's full name
    email VARCHAR(255) NOT NULL UNIQUE,         -- Customer's email (must be unique)
    phone VARCHAR(20),                          -- Customer's phone number
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of record creation
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Last updated timestamp
);

-- Step 4: (Optional) Insert sample data into the customers table
INSERT INTO customers (name, email, phone)
VALUES
('John Doe', 'john.doe@example.com', '123-456-7890'),
('Jane Smith', 'jane.smith@example.com', '987-654-3210');

-- Step 5: Verify the data in the table
SELECT * FROM customers;

-- Step 6: (Optional) Create additional tables if required
-- Example: A sales table to track customer purchases
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- Unique ID for each sale
    customer_id INT NOT NULL,                    -- Foreign key to customers table
    product_name VARCHAR(255) NOT NULL,          -- Name of the product sold
    sale_amount DECIMAL(10, 2) NOT NULL,         -- Sale amount
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of the sale
    FOREIGN KEY (customer_id) REFERENCES customers(id) -- Foreign key constraint
);

-- Step 7: (Optional) Insert sample data into the sales table
INSERT INTO sales (customer_id, product_name, sale_amount)
VALUES
(1, 'Product A', 100.50),
(2, 'Product B', 200.75);

-- Step 8: Verify the sales data
SELECT * FROM sales;

-- Additional Note:
-- Create indexes if required for performance optimization
CREATE INDEX idx_customer_email ON customers(email);
