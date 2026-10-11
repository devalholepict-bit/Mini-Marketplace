const User = require('../models/User');
const Business = require('../models/Business');

/**
 * Helper to serialize a business profile for public-safe view.
 * Strictly excludes privatePitchLink and contactEmail.
 */
const formatPublicSafeBusiness = (business) => ({
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
 * Save a business for the authenticated investor.
 * POST /api/investor/saved/:businessId
 * 
 * Requirements:
 * - Only authenticated investor.
 * - Only published, existing businesses.
 * - Idempotent addition with $addToSet.
 */
const saveBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.validatedParams;

    // Verify target business exists and is published
    const business = await Business.findById(businessId);
    if (!business || !business.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Atomically add to investor's saved businesses list (prevents duplicates)
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedBusinesses: business._id } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Business saved successfully',
      savedBusinesses: updatedUser ? updatedUser.savedBusinesses : []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve saved businesses for the authenticated investor.
 * GET /api/investor/saved
 * 
 * Requirements:
 * - Scoped to req.user only.
 * - Never returns privatePitchLink or contactEmail.
 * - Silently excludes deleted or unpublished businesses.
 */
const getSavedBusinesses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const savedIds = user?.savedBusinesses || [];

    if (savedIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Query published businesses matching the saved IDs, excluding private fields
    const businesses = await Business.find({
      _id: { $in: savedIds },
      isPublished: true
    }).select('-privatePitchLink -contactEmail');

    const data = businesses.map(formatPublicSafeBusiness);

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
 * Remove a business from the authenticated investor's saved list.
 * DELETE /api/investor/saved/:businessId
 * 
 * Requirements:
 * - Scoped to req.user only.
 * - Atomic removal via $pull.
 * - Idempotent: safe if the business was not in the saved list.
 */
const unsaveBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.validatedParams;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedBusinesses: businessId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Business removed from saved list',
      savedBusinesses: updatedUser ? updatedUser.savedBusinesses : []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveBusiness,
  getSavedBusinesses,
  unsaveBusiness
};
