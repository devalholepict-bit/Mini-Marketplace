/**
 * Middleware factory for validating request body against a Zod schema.
 * Replaces req.body with the sanitized/parsed result on success.
 * Returns HTTP 400 with field-specific error messages on failure.
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

  req.body = result.data;
  next();
};

/**
 * Middleware factory for validating request query parameters against a Zod schema.
 * Attaches parsed and coerced query data to req.validatedQuery.
 * Returns HTTP 400 with error details on validation failure.
 * 
 * @param {import('zod').ZodSchema} schema
 */
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Query validation failed',
      errors: formattedErrors
    });
  }

  req.validatedQuery = result.data;
  next();
};

/**
 * Middleware factory for validating request URL route parameters against a Zod schema.
 * Returns HTTP 400 with error details on validation failure.
 * 
 * @param {import('zod').ZodSchema} schema
 */
const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);

  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Invalid request parameters',
      errors: formattedErrors
    });
  }

  req.validatedParams = result.data;
  next();
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams
};
