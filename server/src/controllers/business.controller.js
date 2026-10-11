const Business = require('../models/Business');

/**
 * Helper to serialize a business profile for its owner.
 * Includes owner-only fields (privatePitchLink, contactEmail) while ensuring
 * no internal database artifacts or secrets are exposed.
 */
const formatOwnerBusiness = (business) => ({
  id: business._id,
  owner: business.owner,
  name: business.name,
  tagline: business.tagline,
  description: business.description,
  industry: business.industry,
  country: business.country,
  city: business.city,
  stage: business.stage,
  revenueRange: business.revenueRange,
  fundingGoal: business.fundingGoal,
  purpose: business.purpose,
  isPublished: business.isPublished,
  privatePitchLink: business.privatePitchLink || '',
  contactEmail: business.contactEmail,
  createdAt: business.createdAt,
  updatedAt: business.updatedAt
});

/**
 * Retrieve the authenticated business owner's profile.
 * GET /api/businesses/me
 */
const getMyBusiness = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found. Please create your profile first.'
      });
    }

    res.status(200).json({
      success: true,
      business: formatOwnerBusiness(business)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update the authenticated business owner's profile.
 * PUT /api/businesses/me
 * 
 * Rules:
 * - Upsert: Creates if non-existent (HTTP 201), updates if existing (HTTP 200).
 * - Owner is strictly locked to req.user._id.
 * - Uses an explicit allowlist of editable fields.
 * - Preserves existing isPublished on updates; defaults to false on creation.
 */
const upsertMyBusiness = async (req, res, next) => {
  try {
    const {
      name,
      tagline,
      description,
      industry,
      country,
      city,
      stage,
      revenueRange,
      fundingGoal,
      purpose,
      privatePitchLink,
      contactEmail
    } = req.body;

    // Check if profile already exists for this business owner
    let business = await Business.findOne({ owner: req.user._id });

    if (business) {
      // UPDATE PATH (HTTP 200)
      // Apply explicit editable fields only; never overwrite owner or isPublished
      business.name = name;
      business.tagline = tagline;
      business.description = description;
      business.industry = industry;
      business.country = country;
      business.city = city;
      business.stage = stage;
      business.revenueRange = revenueRange;
      business.fundingGoal = fundingGoal;
      business.purpose = purpose;
      business.privatePitchLink = privatePitchLink || '';
      business.contactEmail = contactEmail;
      // Note: business.isPublished is intentionally preserved

      await business.save();

      return res.status(200).json({
        success: true,
        message: 'Business profile updated successfully',
        business: formatOwnerBusiness(business)
      });
    }

    // CREATE PATH (HTTP 201)
    business = await Business.create({
      owner: req.user._id,
      name,
      tagline,
      description,
      industry,
      country,
      city,
      stage,
      revenueRange,
      fundingGoal,
      purpose,
      privatePitchLink: privatePitchLink || '',
      contactEmail,
      isPublished: false // Always defaults to unpublished on initial creation
    });

    return res.status(201).json({
      success: true,
      message: 'Business profile created successfully',
      business: formatOwnerBusiness(business)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish or unpublish the authenticated owner's profile.
 * PATCH /api/businesses/me/publish
 */
const setPublishStatus = async (req, res, next) => {
  try {
    const { isPublished } = req.body;

    const business = await Business.findOne({ owner: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found. Please create your profile before publishing.'
      });
    }

    // When attempting to publish, verify that core required fields are satisfied
    if (isPublished) {
      const isComplete =
        business.name &&
        business.tagline &&
        business.description &&
        business.fundingGoal &&
        business.contactEmail;

      if (!isComplete) {
        return res.status(400).json({
          success: false,
          message: 'Cannot publish incomplete profile. Please ensure all required fields are filled.'
        });
      }
    }

    business.isPublished = isPublished;
    await business.save();

    res.status(200).json({
      success: true,
      message: business.isPublished
        ? 'Business profile published successfully'
        : 'Business profile unpublished successfully',
      business: formatOwnerBusiness(business)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBusiness,
  upsertMyBusiness,
  setPublishStatus
};
