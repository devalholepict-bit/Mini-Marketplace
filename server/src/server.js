const path = require('path');
const dotenv = require('dotenv');

// Load environment variables reliably from server/.env, falling back to process cwd
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

/**
 * Initialize database connection and start HTTP server
 */
const startServer = async () => {
  try {
    // Establish database connection before accepting traffic
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`MeuLink API server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handling
    const handleShutdown = async (signal) => {
      console.log(`${signal} received: closing HTTP server and database connection`);
      server.close(async () => {
        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          console.log('MongoDB connection closed successfully');
        } catch (err) {
          console.error('Error closing MongoDB connection:', err.message);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('Server startup failed:', error.message || 'Database initialization error');
    process.exit(1);
  }
};

startServer();
