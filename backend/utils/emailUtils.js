const nodemailer = require('nodemailer');

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

const sendEmail = async ({ to, subject, html, attachments }) => {
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
    return info;
  } catch (error) {
    throw error;
  }
};

module.exports = sendEmail;