const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middleware/authenticate');

// Get email history
router.get('/history', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT 
        eh.*,
        CASE
          WHEN eh.order_id IS NOT NULL THEN o.client_name
          WHEN eh.document_id IS NOT NULL THEN c.name
          ELSE eh.recipient_name
        END as recipient_name
      FROM email_history eh
      LEFT JOIN orders o ON eh.order_id = o.id
      LEFT JOIN customers c ON eh.customer_id = c.id
      ORDER BY eh.sent_at DESC
      LIMIT 50
    `;

    const [emails] = await db.promise().query(query);

    const formattedEmails = emails.map(email => ({
      id: email.id,
      type: email.email_type,
      recipient: email.recipient_name || email.recipient_email,
      subject: email.subject,
      sentAt: email.sent_at,
      status: email.status,
      orderId: email.order_id,
      documentId: email.document_id,
      customerId: email.customer_id
    }));

    res.json(formattedEmails);
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({ error: 'Failed to fetch email history' });
  }
});

module.exports = router; 