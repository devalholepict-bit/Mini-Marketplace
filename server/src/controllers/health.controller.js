const mongoose = require('mongoose');

/**
 * Health check controller
 * Reports the operational status of the API service and the live MongoDB connection state.
 * 
 * Note: Does NOT attempt to connect to MongoDB as a side effect; it strictly reads the
 * current readyState from Mongoose (1 = connected, anything else = disconnected).
 */
const getHealthStatus = (req, res) => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    message: 'MeuLink API is running',
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'disconnected'
  });
};

module.exports = {
  getHealthStatus
};
