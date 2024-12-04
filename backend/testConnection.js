const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

testConnection();
