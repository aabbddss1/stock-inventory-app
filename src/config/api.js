const API_BASE_URL = 'http://37.148.210.169:5001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default API_BASE_URL; 