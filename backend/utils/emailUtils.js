const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Qubite Order Management" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments, // Attachments array
  });
  
};

module.exports = sendEmail;
