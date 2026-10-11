const User = require('../models/User');
const { signToken } = require('../utils/jwt');

/**
 * Register a new user (business founder or investor)
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Proactively check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user with explicit allowed fields only (prevents arbitrary field pollution)
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // Generate JWT token
    const token = signToken({ userId: user._id, role: user.role });

    // Respond with sanitized user object
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate existing user and issue token
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password since User model sets select: false
    const user = await User.findOne({ email }).select('+password');

    // Generic error message to prevent account enumeration
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare plaintext candidate password with hashed password in database
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = signToken({ userId: user._id, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve sanitized profile of currently authenticated user
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toSafeObject()
  });
};

module.exports = {
  register,
  login,
  getMe
};
