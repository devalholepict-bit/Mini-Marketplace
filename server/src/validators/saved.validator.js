const { z } = require('zod');

/**
 * Validation schema for saved business URL parameter (:businessId)
 */
const savedBusinessParamSchema = z.object({
  businessId: z
    .string({ required_error: 'Business ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid business ID format. Expected a 24-character hexadecimal ObjectId')
});

module.exports = {
  savedBusinessParamSchema
};
