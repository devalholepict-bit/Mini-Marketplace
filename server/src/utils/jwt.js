const jwt = require('jsonwebtoken');

/**
 * Retrieves the configured JWT secret.
 * Throws a safe, informative error if the secret is not defined in the environment.
 * @returns {string}
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined. Please set it in server/.env');
  }
  return secret;
};

/**
 * Generates a signed JSON Web Token for an authenticated user.
 * 
 * @param {Object} params
 * @param {string} params.userId - MongoDB ObjectId string of the user (assigned to `sub` claim)
 * @param {string} [params.role] - User role ('business' | 'investor')
 * @returns {string} Signed JWT
 */
const signToken = ({ userId, role }) => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  // Include minimum required claims with userId as subject (`sub`)
  const payload = {
    sub: String(userId),
    ...(role && { role })
  };

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifies and decodes a JSON Web Token using the configured secret.
 * Throws an error if the token is invalid or expired.
 * 
 * @param {string} token - The raw JWT string
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyToken
};
