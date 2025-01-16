const nodemailer = require('nodemailer');
const db = require('../db');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async ({ to, subject, html, attachments, type = 'GENERAL', orderId = null, documentId = null, customerId = null }) => {
  try {
    const mailOptions = {
      from: `"Qubite Stock Management" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    if (attachments) {
      mailOptions.attachments = attachments;
    }
    
    const info = await transporter.sendMail(mailOptions);

    // Track the email in database
    const query = `
      INSERT INTO email_history 
      (email_type, recipient_email, subject, status, order_id, document_id, customer_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.promise().query(query, [
      type,
      to,
      subject,
      'sent',
      orderId,
      documentId,
      customerId
    ]);

    return info;
  } catch (error) {
    // Log failed email attempt
    if (db) {
      try {
        const query = `
          INSERT INTO email_history 
          (email_type, recipient_email, subject, status, order_id, document_id, customer_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.promise().query(query, [
          type,
          to,
          subject,
          'failed',
          orderId,
          documentId,
          customerId
        ]);
      } catch (dbError) {
        console.error('Error logging failed email:', dbError);
      }
    }
    throw error;
  }
};

module.exports = sendEmail;