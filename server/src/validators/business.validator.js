const { z } = require('zod');

/**
 * Validation schema for creating or updating a business profile (PUT /api/businesses/me)
 */
const businessProfileSchema = z.object({
  name: z
    .string({ required_error: 'Business name is required' })
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .max(120, 'Business name cannot exceed 120 characters'),
  tagline: z
    .string({ required_error: 'Tagline is required' })
    .trim()
    .min(5, 'Tagline must be at least 5 characters')
    .max(200, 'Tagline cannot exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  industry: z
    .string({ required_error: 'Industry is required' })
    .trim()
    .min(2, 'Industry must be at least 2 characters')
    .max(100, 'Industry cannot exceed 100 characters'),
  country: z
    .string({ required_error: 'Country is required' })
    .trim()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country cannot exceed 100 characters'),
  city: z
    .string({ required_error: 'City is required' })
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City cannot exceed 100 characters'),
  stage: z
    .string({ required_error: 'Company stage is required' })
    .trim()
    .min(2, 'Stage must be at least 2 characters')
    .max(100, 'Stage cannot exceed 100 characters'),
  revenueRange: z
    .string({ required_error: 'Revenue range is required' })
    .trim()
    .min(2, 'Revenue range must be at least 2 characters')
    .max(100, 'Revenue range cannot exceed 100 characters'),
  fundingGoal: z
    .number({
      required_error: 'Funding goal is required',
      invalid_type_error: 'Funding goal must be a valid number'
    })
    .positive('Funding goal must be a positive number greater than 0')
    .finite('Funding goal must be a finite number'),
  purpose: z
    .string({ required_error: 'Funding purpose is required' })
    .trim()
    .min(5, 'Funding purpose must be at least 5 characters')
    .max(1000, 'Funding purpose cannot exceed 1000 characters'),
  privatePitchLink: z
    .string()
    .trim()
    .max(500, 'Private pitch link cannot exceed 500 characters')
    .optional()
    .default(''),
  contactEmail: z
    .string({ required_error: 'Contact email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid contact email address')
});

/**
 * Validation schema for publishing/unpublishing business profile (PATCH /api/businesses/me/publish)
 */
const publishSchema = z.object({
  isPublished: z.boolean({
    required_error: 'isPublished is required',
    invalid_type_error: 'isPublished must be a boolean (true or false)'
  })
});

/**
 * Validation schema for marketplace query parameters (GET /api/businesses)
 */
const businessQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    industry: z.string().trim().optional(),
    stage: z.string().trim().optional(),
    country: z.string().trim().optional(),
    minFunding: z.coerce
      .number({ invalid_type_error: 'minFunding must be a valid number' })
      .positive('minFunding must be a positive number greater than 0')
      .finite('minFunding must be a finite number')
      .optional(),
    maxFunding: z.coerce
      .number({ invalid_type_error: 'maxFunding must be a valid number' })
      .positive('maxFunding must be a positive number greater than 0')
      .finite('maxFunding must be a finite number')
      .optional(),
    page: z.coerce
      .number({ invalid_type_error: 'page must be a number' })
      .int('page must be an integer')
      .min(1, 'page must be at least 1')
      .default(1),
    limit: z.coerce
      .number({ invalid_type_error: 'limit must be a number' })
      .int('limit must be an integer')
      .min(1, 'limit must be at least 1')
      .max(50, 'limit cannot exceed 50')
      .default(12),
    sortBy: z
      .enum(['createdAt', 'fundingGoal', 'name'], {
        errorMap: () => ({ message: "sortBy must be one of: 'createdAt', 'fundingGoal', 'name'" })
      })
      .default('createdAt'),
    order: z
      .enum(['asc', 'desc'], {
        errorMap: () => ({ message: "order must be either 'asc' or 'desc'" })
      })
      .default('desc')
  })
  .refine(
    (data) => {
      if (data.minFunding !== undefined && data.maxFunding !== undefined) {
        return data.minFunding <= data.maxFunding;
      }
      return true;
    },
    {
      message: 'minFunding cannot be greater than maxFunding',
      path: ['minFunding']
    }
  );

/**
 * Validation schema for business detail ID param (GET /api/businesses/:id)
 */
const businessIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Business ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid business ID format. Expected a 24-character hexadecimal ObjectId')
});

module.exports = {
  businessProfileSchema,
  publishSchema,
  businessQuerySchema,
  businessIdParamSchema
};
