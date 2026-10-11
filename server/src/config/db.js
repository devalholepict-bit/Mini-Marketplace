const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas using Mongoose
 * Reads MONGODB_URI from environment variables.
 * Does not expose connection strings, passwords, or credentials in logs.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined. Please set it in server/.env');
  }

  try {
    // Mongoose 8+ manages connection pooling and modern defaults automatically
    await mongoose.connect(uri);
    console.log('MongoDB connection established successfully');
  } catch (error) {
    // Safe error message without leaking URI or secrets
    console.error('Failed to connect to MongoDB Atlas:', error.message || 'Unknown database connection error');
    throw error;
  }
};

module.exports = connectDB;
