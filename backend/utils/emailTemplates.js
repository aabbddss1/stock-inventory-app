const generateEmailTemplate = ({ subjectTitle, clientName, messageBody, orderId, productName, quantity, price, status, adminEmail }) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; }
    .email-container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
    .header { background: #007bff; color: #fff; padding: 20px; text-align: center; font-size: 24px; }
    .content { padding: 20px; }
    .content h1 { font-size: 22px; color: #333; }
    .content p { font-size: 16px; line-height: 1.5; }
    .order-details { margin: 20px 0; border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
    .order-details table { width: 100%; border-collapse: collapse; }
    .order-details th, .order-details td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
    .footer { text-align: center; padding: 15px; background: #f9f9f9; font-size: 14px; color: #666; }
    .footer a { color: #007bff; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">Qubite Orders</div>
    <div class="content">
      <h1>${subjectTitle}</h1>
      <p>Dear ${clientName},</p>
      <p>${messageBody}</p>
      <div class="order-details">
        <h3>Order Details</h3>
        <table>
          <tr><th>Order ID</th><td>${orderId}</td></tr>
          <tr><th>Product Name</th><td>${productName}</td></tr>
          <tr><th>Quantity</th><td>${quantity}</td></tr>
          <tr><th>Total Price</th><td>$${price}</td></tr>
          ${status ? `<tr><th>Status</th><td>${status}</td></tr>` : ''}
        </table>
      </div>
      <p>If you have any questions, please contact us at <a href="mailto:${adminEmail}">${adminEmail}</a>.</p>
    </div>
    <div class="footer">
      <p>Thank you for choosing Qubite!</p>
      <p><a href="https://yourwebsite.com">Visit our website</a> | <a href="mailto:${adminEmail}">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
`;

module.exports = { generateEmailTemplate };
