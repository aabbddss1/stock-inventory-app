const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://stock-inventory-app-v70m.onrender.com'
  : 'http://localhost:5001';

export default API_BASE_URL; 