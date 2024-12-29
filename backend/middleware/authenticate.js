const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Authorization header missing or invalid');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        console.error('Token expired:', token);
        return res.status(401).json({ error: 'Unauthorized: Token expired' });
      }
      console.error('Invalid token:', err.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Ensure decoded token has the required fields
    if (!decoded || !decoded.id) {
      console.error('Decoded token does not contain required fields:', decoded);
      return res.status(400).json({ error: 'Invalid token payload' });
    }

    // Attach user information to the request object
    req.user = decoded;
    next();
  });
};

module.exports = authenticate;
