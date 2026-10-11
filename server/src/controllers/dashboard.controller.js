const mongoose = require('mongoose');
const User = require('../models/User');
const Business = require('../models/Business');
const Interest = require('../models/Interest');

/**
 * Aggregates Interest documents grouped by their status using a Mongoose
 * $match -> $group aggregation pipeline.
 * 
 * Ensures consistent output structure with missing status groups normalized to 0.
 * 
 * @param {Object} matchCondition - Trusted match criteria (e.g. { business: businessId } or { investor: investorId })
 * @returns {Promise<{ total: number, pending: number, accepted: number, declined: number }>}
 */
const aggregateInterestStats = async (matchCondition) => {
  const stats = {
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0
  };

  // Convert IDs to MongoDB ObjectId if string to ensure aggregation engine matches correctly
  const normalizedMatch = {};
  for (const [key, value] of Object.entries(matchCondition)) {
    if (value && typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
      normalizedMatch[key] = new mongoose.Types.ObjectId(value);
    } else {
      normalizedMatch[key] = value;
    }
  }

  // Execute Mongoose aggregation pipeline: $match -> $group by $status
  const results = await Interest.aggregate([
    { $match: normalizedMatch },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  if (Array.isArray(results)) {
    for (const item of results) {
      if (item && item._id && typeof item.count === 'number') {
        if (Object.prototype.hasOwnProperty.call(stats, item._id)) {
          stats[item._id] = item.count;
        }
      }
    }
  }

  stats.total = stats.pending + stats.accepted + stats.declined;
  return stats;
};

/**
 * Retrieves role-based dashboard statistics for the authenticated user.
 * GET /api/dashboard/stats
 * 
 * Access: Authenticated users.
 * Rules:
 * - Role is derived exclusively from req.user.role; caller cannot supply arbitrary target IDs.
 * - Business founders receive profile status and received interest counts.
 * - Investors receive available published businesses, valid saved businesses, and sent interest counts.
 * - No sensitive credentials or private business fields are leaked.
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const { role, _id: userId } = req.user;

    if (role === 'business') {
      // Find the Business profile owned by the authenticated founder
      const business = await Business.findOne({ owner: userId });

      if (!business) {
        return res.status(200).json({
          success: true,
          role: 'business',
          stats: {
            profileExists: false,
            isPublished: false,
            interestsReceived: {
              total: 0,
              pending: 0,
              accepted: 0,
              declined: 0
            }
          }
        });
      }

      // Count received interests grouped by status using aggregation
      const interestsReceived = await aggregateInterestStats({
        business: business._id
      });

      return res.status(200).json({
        success: true,
        role: 'business',
        stats: {
          profileExists: true,
          isPublished: Boolean(business.isPublished),
          interestsReceived
        }
      });
    }

    if (role === 'investor') {
      // 1. Count currently published businesses available in marketplace
      const availableBusinesses = await Business.countDocuments({ isPublished: true });

      // 2. Count saved businesses that are published and still exist
      const user = await User.findById(userId).select('savedBusinesses');
      const savedIds = user?.savedBusinesses || [];

      let savedBusinesses = 0;
      if (savedIds.length > 0) {
        savedBusinesses = await Business.countDocuments({
          _id: { $in: savedIds },
          isPublished: true
        });
      }

      // 3. Count sent interests grouped by status using aggregation
      const interestsSent = await aggregateInterestStats({
        investor: userId
      });

      return res.status(200).json({
        success: true,
        role: 'investor',
        stats: {
          availableBusinesses,
          savedBusinesses,
          interestsSent
        }
      });
    }

    // Guard against unsupported roles
    return res.status(403).json({
      success: false,
      message: `Forbidden: User role '${role}' is not supported for dashboard statistics`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  aggregateInterestStats
};
