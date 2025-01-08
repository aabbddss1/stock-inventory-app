const handleLogin = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
    
    // Make sure this data is being set
    localStorage.setItem('customerId', response.data.customerId); // or user.id
    localStorage.setItem('role', response.data.role);
    localStorage.setItem('token', response.data.token);
    
    // ... rest of login logic
  } catch (error) {
    console.error('Login failed:', error);
  }
}; 