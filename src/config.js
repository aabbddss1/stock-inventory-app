const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://37.148.210.169:5001/api'
  : 'http://37.148.210.169:5001/';

export default API_BASE_URL; 