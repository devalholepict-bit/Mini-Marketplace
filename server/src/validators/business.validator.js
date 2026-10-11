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

module.exports = {
  businessProfileSchema,
  publishSchema
};
