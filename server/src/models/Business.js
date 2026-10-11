const mongoose = require('mongoose');

/**
 * Business Schema
 * Represents a business profile published by a founder seeking investment.
 * 
 * NOTE ON PRIVATE FIELDS:
 * Fields like `privatePitchLink` and `contactEmail` are private.
 * In Stage 5 discovery and detail responses, they are filtered out unless the requester
 * is the profile owner or an investor with an accepted interest request.
 */
const businessSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
      unique: true // Ensures each business owner has at most one published business profile
    },
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [120, 'Business name cannot exceed 120 characters']
    },
    tagline: {
      type: String,
      required: [true, 'Tagline is required'],
      trim: true,
      maxlength: [200, 'Tagline cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    stage: {
      type: String,
      required: [true, 'Stage is required'],
      trim: true
    },
    revenueRange: {
      type: String,
      required: [true, 'Revenue range is required'],
      trim: true
    },
    fundingGoal: {
      type: Number,
      required: [true, 'Funding goal is required'],
      min: [1, 'Funding goal must be a positive number greater than 0']
    },
    purpose: {
      type: String,
      required: [true, 'Funding purpose is required'],
      trim: true
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    privatePitchLink: {
      type: String,
      trim: true,
      default: ''
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid contact email']
    }
  },
  {
    timestamps: true
  }
);

// Indexes optimizing marketplace queries
businessSchema.index({ isPublished: 1, createdAt: -1 });
businessSchema.index({ isPublished: 1, industry: 1 });
businessSchema.index({ isPublished: 1, stage: 1 });
businessSchema.index({ isPublished: 1, fundingGoal: 1 });

// Prevent duplicate model compilation in test environments
module.exports = mongoose.models.Business || mongoose.model('Business', businessSchema);
