CREATE TABLE IF NOT EXISTS email_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent',
  order_id INT,
  document_id INT,
  customer_id INT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_sent_at (sent_at),
  INDEX idx_status (status),
  INDEX idx_email_type (email_type)
); 