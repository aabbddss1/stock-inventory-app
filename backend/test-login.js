const fetch = require('node-fetch');

const login = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/customers/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@pw.com',
        password: 'Kcs%F$w6GH',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Login Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

login();
