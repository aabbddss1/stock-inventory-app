require('dotenv').config(); // Load environment variables
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI; // Get MONGO_URI from .env

async function run() {
  try {
    if (!uri) throw new Error("MONGO_URI is undefined");
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected successfully to MongoDB");
    await client.close();
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

run();
