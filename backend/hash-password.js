const bcrypt = require('bcrypt');

const hashPassword = async () => {
  const plainPassword = 'Kcs%F$w6GH'; // Replace with your plain password
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log('Hashed Password:', hashedPassword);
  } catch (error) {
    console.error('Error hashing password:', error.message);
  }
};

hashPassword();
