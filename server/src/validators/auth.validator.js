const { z } = require('zod');

/**
 * Validation schema for user registration (POST /api/auth/register)
 */
const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password cannot exceed 100 characters'),
  role: z.enum(['business', 'investor'], {
    errorMap: () => ({ message: "Role must be either 'business' or 'investor'" })
  })
});

/**
 * Validation schema for user login (POST /api/auth/login)
 */
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(100, 'Password cannot exceed 100 characters')
});

module.exports = {
  registerSchema,
  loginSchema
};
