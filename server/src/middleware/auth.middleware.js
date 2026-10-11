const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

/**
 * Authentication Middleware
 * 
 * Verifies the Bearer JWT from the Authorization header,
 * loads the corresponding user from the database, and attaches
 * the authenticated user entity to `req.user`.
 * 
 * Never trusts client-supplied user parameters in request bodies or query params.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check header presence and 'Bearer <token>' format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing or malformed authorization header. Expected "Bearer <token>"'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token is missing from authorization header'
      });
    }

    // Verify token cryptographic signature and expiration
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired token'
      });
    }

    if (!decoded || !decoded.sub) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token payload'
      });
    }

    // Retrieve active user from database
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User account no longer exists'
      });
    }

    // Attach authenticated user document to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate
};
