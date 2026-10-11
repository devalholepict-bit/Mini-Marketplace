const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { validateBody } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

// POST /api/auth/register - Register new user account
router.post('/register', validateBody(registerSchema), register);

// POST /api/auth/login - Authenticate existing user credentials
router.post('/login', validateBody(loginSchema), login);

// GET /api/auth/me - Retrieve current authenticated user profile
router.get('/me', authenticate, getMe);

module.exports = router;
