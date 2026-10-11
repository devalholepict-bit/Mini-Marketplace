const Business = require('../models/Business');
const Interest = require('../models/Interest');

/**
 * Escapes special characters for safe regular expression querying in MongoDB.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Helper to serialize a business profile for public marketplace view.
 * Strictly excludes private fields (privatePitchLink, contactEmail).
 */
const formatPublicBusiness = (business) => ({
  id: business._id,
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
  createdAt: business.createdAt
});

/**
 * Helper to serialize a business profile for its owner.
 * Includes private fields while keeping internal artifacts safe.
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
 * Helper to serialize a detail business view based on privacy permissions.
 */
const formatDetailBusiness = (business, canViewPrivate) => {
  const base = {
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
    createdAt: business.createdAt,
    updatedAt: business.updatedAt
  };

  if (canViewPrivate) {
    base.privatePitchLink = business.privatePitchLink || '';
    base.contactEmail = business.contactEmail;
  }

  return base;
};

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

    let business = await Business.findOne({ owner: req.user._id });

    if (business) {
      // Update existing profile (preserve isPublished)
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

      await business.save();

      return res.status(200).json({
        success: true,
        message: 'Business profile updated successfully',
        business: formatOwnerBusiness(business)
      });
    }

    // Create new profile (defaults to unpublished)
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
      isPublished: false
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

/**
 * Marketplace Discovery: list published businesses with search, filters, and pagination.
 * GET /api/businesses
 * 
 * Access: Investors only.
 */
const listBusinesses = async (req, res, next) => {
  try {
    const {
      q,
      industry,
      stage,
      country,
      minFunding,
      maxFunding,
      page,
      limit,
      sortBy,
      order
    } = req.validatedQuery;

    // Base query: strictly published businesses only
    const filter = { isPublished: true };

    // Search text across name, tagline, description
    if (q) {
      const escaped = escapeRegex(q);
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: searchRegex },
        { tagline: searchRegex },
        { description: searchRegex }
      ];
    }

    // Exact field filters
    if (industry) filter.industry = industry;
    if (stage) filter.stage = stage;
    if (country) filter.country = country;

    // Range filter for funding goal
    if (minFunding !== undefined || maxFunding !== undefined) {
      filter.fundingGoal = {};
      if (minFunding !== undefined) filter.fundingGoal.$gte = minFunding;
      if (maxFunding !== undefined) filter.fundingGoal.$lte = maxFunding;
    }

    // Sort definition with deterministic tie-breaker
    const sortDirection = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortDirection };
    if (sortBy !== '_id') {
      sort._id = sortDirection;
    }

    // Pagination calculations
    const skip = (page - 1) * limit;

    // Execute count and query in parallel
    const [total, businesses] = await Promise.all([
      Business.countDocuments(filter),
      Business.find(filter).sort(sort).skip(skip).limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 0;

    res.status(200).json({
      success: true,
      data: businesses.map(formatPublicBusiness),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Business Detail View
 * GET /api/businesses/:id
 * 
 * Access: Authenticated users.
 * Rules:
 * - Unpublished businesses are 404 for non-owners.
 * - Private fields (privatePitchLink, contactEmail) are exposed only to the owner
 *   or an investor whose interest has status='accepted'.
 */
const getBusinessById = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;

    const business = await Business.findById(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const isOwner = business.owner.toString() === req.user._id.toString();

    // Unpublished businesses cannot be viewed by non-owners
    if (!business.isPublished && !isOwner) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Determine private field access
    let canViewPrivate = isOwner;

    if (!canViewPrivate && req.user.role === 'investor') {
      const acceptedInterest = await Interest.findOne({
        investor: req.user._id,
        business: business._id,
        status: 'accepted'
      });
      canViewPrivate = Boolean(acceptedInterest);
    }

    res.status(200).json({
      success: true,
      business: formatDetailBusiness(business, canViewPrivate)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBusiness,
  upsertMyBusiness,
  setPublishStatus,
  listBusinesses,
  getBusinessById
};
