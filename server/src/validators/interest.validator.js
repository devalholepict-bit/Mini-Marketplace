const { z } = require('zod');

/**
 * Validation schema for creating an expression of interest (POST /api/interests)
 * Strict validation ensures client cannot inject investor, status, or arbitrary model fields.
 */
const createInterestSchema = z
  .object({
    businessId: z
      .string({ required_error: 'Business ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid business ID format. Expected a 24-character hexadecimal ObjectId'),
    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message cannot exceed 1000 characters')
  })
  .strict({ message: 'Unrecognized fields in request body' });

/**
 * Validation schema for updating interest status (PATCH /api/interests/:id/status)
 * Only 'accepted' and 'declined' are valid transitions from pending.
 */
const updateInterestStatusSchema = z
  .object({
    status: z.enum(['accepted', 'declined'], {
      errorMap: () => ({ message: "Status must be either 'accepted' or 'declined'" })
    })
  })
  .strict({ message: 'Unrecognized fields in request body' });

/**
 * Validation schema for interest URL route parameter (:id)
 */
const interestIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Interest ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid interest ID format. Expected a 24-character hexadecimal ObjectId')
});

module.exports = {
  createInterestSchema,
  updateInterestStatusSchema,
  interestIdParamSchema
};
