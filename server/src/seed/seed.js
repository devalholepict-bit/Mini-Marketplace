const path = require('path');
const mongoose = require('mongoose');

// Load environment variables if running as standalone script
if (require.main === module) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

const connectDB = require('../config/db.js');
const User = require('../models/User');
const Business = require('../models/Business');
const Interest = require('../models/Interest');

/**
 * Validates prerequisites before seeding demo data.
 * Protects against accidental execution in production and ensures a seed password is provided.
 */
const validateSeedEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is strictly forbidden in production environments (NODE_ENV=production).');
  }

  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    throw new Error(
      'SEED_DEMO_PASSWORD environment variable is required. Please set it in server/.env before seeding.'
    );
  }

  return password.trim();
};

/**
 * Fictional demo dataset definitions.
 * Designed to provide realistic marketplace activity across both roles.
 */
const getDemoDataDefinitions = (seedPassword) => ({
  users: [
    {
      name: 'Demo Investor (Atlas Syndicate)',
      email: 'demo.investor@meulink.dev',
      role: 'investor',
      password: seedPassword
    },
    {
      name: 'Demo Angel (Helena Silva)',
      email: 'demo.angel@meulink.dev',
      role: 'investor',
      password: seedPassword
    },
    {
      name: 'Demo Founder (Dr. Sofia Mendes)',
      email: 'demo.founder1@meulink.dev',
      role: 'business',
      password: seedPassword
    },
    {
      name: 'Demo Founder (Marco Silva)',
      email: 'demo.founder2@meulink.dev',
      role: 'business',
      password: seedPassword
    }
  ],
  businesses: [
    {
      ownerEmail: 'demo.founder1@meulink.dev',
      name: 'ApexQuantum Therapeutics',
      tagline: 'AI-accelerated quantum simulation for targeted oncology drug discovery',
      description:
        'ApexQuantum couples hybrid quantum-classical algorithms with high-throughput in vitro validation to compress oncology lead discovery timelines from four years to six months.',
      industry: 'BioTech',
      country: 'Portugal',
      city: 'Lisbon',
      stage: 'Seed',
      revenueRange: '€100k - €500k ARR',
      fundingGoal: 750000,
      purpose: 'Accelerate Phase 1 in-vitro trials and compute node cluster expansion',
      isPublished: true,
      privatePitchLink: 'https://dataroom.meulink.dev/apexquantum-seed',
      contactEmail: 'founders@apexquantum.pt'
    },
    {
      ownerEmail: 'demo.founder2@meulink.dev',
      name: 'VerdeGrid Energy Systems',
      tagline: 'Next-generation flow battery storage for agricultural microgrids',
      description:
        'VerdeGrid manufactures modular, non-degrading aqueous iron flow battery systems tailored for rural distributed renewable grids and commercial agro-industrial operations.',
      industry: 'CleanTech',
      country: 'Portugal',
      city: 'Porto',
      stage: 'Series A',
      revenueRange: '€500k - €1M ARR',
      fundingGoal: 1500000,
      purpose: 'Manufacturing scaling and ISO certification for European distribution',
      isPublished: true,
      privatePitchLink: 'https://dataroom.meulink.dev/verdegrid-series-a',
      contactEmail: 'invest@verdegrid.pt'
    }
  ],
  interests: [
    {
      investorEmail: 'demo.investor@meulink.dev',
      businessOwnerEmail: 'demo.founder1@meulink.dev',
      message:
        'Our syndicate is actively investing in AI-driven BioTech platforms. We would like to evaluate your technical data room.',
      status: 'accepted'
    },
    {
      investorEmail: 'demo.investor@meulink.dev',
      businessOwnerEmail: 'demo.founder2@meulink.dev',
      message:
        'Following up from Lisbon Tech Summit. We want to discuss participating in your CleanTech Series A round.',
      status: 'pending'
    },
    {
      investorEmail: 'demo.angel@meulink.dev',
      businessOwnerEmail: 'demo.founder2@meulink.dev',
      message:
        'Interested in reviewing your CAPEX model and warranty reserves for agricultural deployments.',
      status: 'declined'
    }
  ],
  saved: [
    {
      investorEmail: 'demo.investor@meulink.dev',
      businessOwnerEmail: 'demo.founder1@meulink.dev'
    },
    {
      investorEmail: 'demo.angel@meulink.dev',
      businessOwnerEmail: 'demo.founder2@meulink.dev'
    }
  ]
});

/**
 * Main seeding logic.
 * Idempotent: safe to run multiple times without deleting records, resetting statuses, or duplicating items.
 * 
 * @param {Object} [options]
 * @param {boolean} [options.skipDbConnection=false] - For tests using mocked Mongoose
 * @returns {Promise<Object>} Summary of created and preserved entities
 */
const seedDatabase = async (options = {}) => {
  const seedPassword = validateSeedEnvironment();
  const shouldConnect = !options.skipDbConnection && mongoose.connection.readyState !== 1;

  if (shouldConnect) {
    await connectDB();
  }

  const summary = {
    usersCreated: 0,
    usersPreserved: 0,
    businessesCreated: 0,
    businessesPreserved: 0,
    interestsCreated: 0,
    interestsPreserved: 0,
    savedUpdated: 0
  };

  try {
    const { users, businesses, interests, saved } = getDemoDataDefinitions(seedPassword);

    // 1. Seed or preserve demo users
    const userMap = {};
    for (const userDef of users) {
      let user = await User.findOne({ email: userDef.email });

      if (user) {
        if (user.role !== userDef.role) {
          throw new Error(
            `Safety Error: Existing account for '${userDef.email}' has unexpected role '${user.role}' instead of '${userDef.role}'. Seeding halted.`
          );
        }
        summary.usersPreserved += 1;
      } else {
        // Create new user (triggers bcrypt pre-save password hash)
        user = await User.create({
          name: userDef.name,
          email: userDef.email,
          password: userDef.password,
          role: userDef.role
        });
        summary.usersCreated += 1;
      }

      userMap[userDef.email] = user;
    }

    // 2. Seed or preserve demo business profiles
    const businessMap = {};
    for (const bizDef of businesses) {
      const owner = userMap[bizDef.ownerEmail];
      if (!owner) continue;

      let business = await Business.findOne({ owner: owner._id });

      if (business) {
        summary.businessesPreserved += 1;
      } else {
        business = await Business.create({
          owner: owner._id,
          name: bizDef.name,
          tagline: bizDef.tagline,
          description: bizDef.description,
          industry: bizDef.industry,
          country: bizDef.country,
          city: bizDef.city,
          stage: bizDef.stage,
          revenueRange: bizDef.revenueRange,
          fundingGoal: bizDef.fundingGoal,
          purpose: bizDef.purpose,
          isPublished: bizDef.isPublished,
          privatePitchLink: bizDef.privatePitchLink,
          contactEmail: bizDef.contactEmail
        });
        summary.businessesCreated += 1;
      }

      businessMap[bizDef.ownerEmail] = business;
    }

    // 3. Seed or preserve demo expressions of interest
    for (const intDef of interests) {
      const investor = userMap[intDef.investorEmail];
      const business = businessMap[intDef.businessOwnerEmail];

      if (!investor || !business) continue;

      const existingInterest = await Interest.findOne({
        investor: investor._id,
        business: business._id
      });

      if (existingInterest) {
        // Preserve existing status and message
        summary.interestsPreserved += 1;
      } else {
        await Interest.create({
          investor: investor._id,
          business: business._id,
          message: intDef.message,
          status: intDef.status
        });
        summary.interestsCreated += 1;
      }
    }

    // 4. Seed saved businesses for demo investors
    for (const saveDef of saved) {
      const investor = userMap[saveDef.investorEmail];
      const business = businessMap[saveDef.businessOwnerEmail];

      if (!investor || !business) continue;

      await User.findByIdAndUpdate(
        investor._id,
        { $addToSet: { savedBusinesses: business._id } },
        { new: true }
      );
      summary.savedUpdated += 1;
    }

    return summary;
  } finally {
    if (shouldConnect) {
      await mongoose.connection.close();
    }
  }
};

// Execute directly if run via CLI
if (require.main === module) {
  seedDatabase()
    .then((summary) => {
      console.log('✓ Demo data seed completed successfully.');
      console.log(
        `  Users: ${summary.usersCreated} created, ${summary.usersPreserved} preserved.`
      );
      console.log(
        `  Businesses: ${summary.businessesCreated} created, ${summary.businessesPreserved} preserved.`
      );
      console.log(
        `  Interests: ${summary.interestsCreated} created, ${summary.interestsPreserved} preserved.`
      );
      console.log(`  Saved bookmarks updated: ${summary.savedUpdated}.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ Seed failed:', err.message);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  validateSeedEnvironment,
  getDemoDataDefinitions
};
