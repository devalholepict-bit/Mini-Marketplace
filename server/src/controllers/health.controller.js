/**
 * Health check controller
 * Verifies that the API service is up and running.
 */
const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MeuLink API is running',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus
};
