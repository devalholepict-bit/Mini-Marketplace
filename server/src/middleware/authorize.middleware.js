/**
 * Role-Based Authorization Middleware Factory
 * 
 * Enforces that an authenticated request (via authenticate middleware)
 * has one of the specified allowed roles.
 * 
 * Examples:
 *   router.post('/business/profile', authenticate, authorize('business'), createProfile);
 *   router.get('/marketplace', authenticate, authorize('investor', 'business'), listMarketplace);
 * 
 * @param {...string} allowedRoles - One or more roles allowed to access the route
 * @returns {import('express').RequestHandler}
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Return HTTP 401 if authentication middleware has not populated req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required before authorization check'
      });
    }

    // Return HTTP 403 if user role does not match allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  authorize
};
