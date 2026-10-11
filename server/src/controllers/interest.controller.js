const Interest = require('../models/Interest');
const Business = require('../models/Business');

/**
 * Format a business object with public-safe fields only.
 * Strictly excludes privatePitchLink and contactEmail.
 */
const formatPublicSafeBusiness = (business) => {
  if (!business) return null;
  return {
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
    isPublished: business.isPublished,
    createdAt: business.createdAt
  };
};

/**
 * Submit an expression of investment interest.
 * POST /api/interests
 * 
 * Requirements:
 * - Only authenticated investor.
 * - Valid target business and must be published.
 * - Atomic prevention of duplicate submissions (HTTP 409 on compound unique index).
 * - Fixed initial status: 'pending'.
 */
const createInterest = async (req, res, next) => {
  try {
    const { businessId, message } = req.body;

    // Verify target business exists and is published
    const business = await Business.findById(businessId);
    if (!business || !business.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Application-level pre-check for existing interest
    const existingInterest = await Interest.findOne({
      investor: req.user._id,
      business: business._id
    });

    if (existingInterest) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an expression of interest for this business'
      });
    }

    // Create new interest (database compound index enforces uniqueness under concurrency)
    const newInterest = await Interest.create({
      investor: req.user._id,
      business: business._id,
      message,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Interest submitted successfully',
      data: {
        id: newInterest._id,
        investor: newInterest.investor,
        business: newInterest.business,
        message: newInterest.message,
        status: newInterest.status,
        createdAt: newInterest.createdAt,
        updatedAt: newInterest.updatedAt
      }
    });
  } catch (error) {
    // Handle database-level unique constraint collision (E11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an expression of interest for this business'
      });
    }
    next(error);
  }
};

/**
 * List expressions of interest sent by the authenticated investor.
 * GET /api/interests/sent
 * 
 * Requirements:
 * - Scoped strictly to req.user._id.
 * - Newest first.
 * - Includes public-safe business details without private fields.
 * - Handles missing/deleted business references safely.
 */
const getSentInterests = async (req, res, next) => {
  try {
    const interests = await Interest.find({ investor: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'business',
        select: 'name tagline description industry country city stage revenueRange fundingGoal purpose isPublished createdAt'
      });

    const data = interests.map((item) => ({
      id: item._id,
      message: item.message,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      business: formatPublicSafeBusiness(item.business)
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List expressions of interest received by the authenticated business founder.
 * GET /api/interests/received
 * 
 * Requirements:
 * - Scoped strictly to the authenticated founder's business profile.
 * - Newest first.
 * - Populates only safe investor fields (name, email, id). Never leaks password hashes or tokens.
 * - Returns clean empty list if founder has no business profile yet.
 */
const getReceivedInterests = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const interests = await Interest.find({ business: business._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'investor',
        select: 'name email'
      });

    const data = interests.map((item) => ({
      id: item._id,
      message: item.message,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      investor: item.investor
        ? {
            id: item.investor._id,
            name: item.investor.name,
            email: item.investor.email
          }
        : null
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept or decline an expression of interest.
 * PATCH /api/interests/:id/status
 * 
 * Requirements:
 * - Authenticated business role.
 * - Belongs to the authenticated founder's business profile.
 * - Only valid transitions: 'pending' -> 'accepted' or 'pending' -> 'declined'.
 * - Terminal statuses ('accepted', 'declined') can never be updated (HTTP 409).
 * - Atomic conditional update to prevent conflicting race conditions.
 */
const updateInterestStatus = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;
    const { status } = req.body;

    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    // Atomically transition only if currently 'pending' and belongs to this business
    const updatedInterest = await Interest.findOneAndUpdate(
      {
        _id: id,
        business: business._id,
        status: 'pending'
      },
      {
        $set: { status }
      },
      {
        new: true
      }
    );

    if (!updatedInterest) {
      // Determine if the interest does not exist/belong or is already in a terminal state
      const existingInterest = await Interest.findById(id);

      if (!existingInterest || existingInterest.business.toString() !== business._id.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Interest not found'
        });
      }

      // Interest exists and belongs to this business, but is no longer pending
      return res.status(409).json({
        success: false,
        message: `Interest has already been ${existingInterest.status} and cannot be modified`
      });
    }

    res.status(200).json({
      success: true,
      message: `Interest ${status} successfully`,
      data: {
        id: updatedInterest._id,
        investor: updatedInterest.investor,
        business: updatedInterest.business,
        message: updatedInterest.message,
        status: updatedInterest.status,
        createdAt: updatedInterest.createdAt,
        updatedAt: updatedInterest.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInterest,
  getSentInterests,
  getReceivedInterests,
  updateInterestStatus
};
