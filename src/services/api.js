import axios from 'axios';

const API_URL = 'http://localhost:5001/api'; // Replace with your backend API base URL

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Add request interceptor for Authorization header
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Get token from local storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Attach token to request headers
  }
  return config;
});

// Add response interceptor for token expiration
axiosInstance.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response.data.error;
      if (errorMessage === 'Unauthorized: Token expired') {
        localStorage.removeItem('token'); // Clear the expired token
        window.location.href = '/login'; // Redirect to the login page
      }
    }
    return Promise.reject(error); // Propagate other errors
  }
);

// Define API calls using the Axios instance
export const loginUser = async (username, password) => {
  try {
    const response = await axiosInstance.post('/login', { username, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
};

export const fetchCustomers = async () => {
  try {
    const response = await axiosInstance.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

export const fetchOrders = async () => {
  try {
    const response = await axiosInstance.get('/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export default axiosInstance;
