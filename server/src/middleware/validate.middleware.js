/**
 * Middleware factory for validating request body against a Zod schema.
 * Replaces req.body with the sanitized/parsed result on success.
 * Returns HTTP 400 with field-specific error messages on failure,
 * ensuring passwords and sensitive payloads are never reflected in error responses.
 * 
 * @param {import('zod').ZodSchema} schema
 */
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  // Assign sanitized and normalized data to req.body
  req.body = result.data;
  next();
};

module.exports = {
  validateBody
};
