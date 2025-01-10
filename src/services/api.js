// src/services/api.js
import axios from 'axios';

const API_URL = 'http://37.148.210.169:5001/api'; // Replace with actual backend URL

export const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
};