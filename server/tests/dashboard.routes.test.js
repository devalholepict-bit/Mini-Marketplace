const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Business = require('../src/models/Business');
const Interest = require('../src/models/Interest');
const { signToken } = require('../src/utils/jwt');

describe('Dashboard Statistics API (Stage 7 Integration)', () => {
  const originalSecret = process.env.JWT_SECRET;
  const testSecret = 'dashboard_test_jwt_secret_antigravity';

  const founderWithProfile = {
    _id: '65f01234567890abcdef1001',
    name: 'Founder Alice',
    email: 'alice@startup.com',
    role: 'business',
    password: 'hashed_password_alice'
  };

  const otherFounder = {
    _id: '65f01234567890abcdef1002',
    name: 'Founder Bob',
    email: 'bob@startup.com',
    role: 'business',
    password: 'hashed_password_bob'
  };

  const founderWithoutProfile = {
    _id: '65f01234567890abcdef1003',
    name: 'Founder Carol',
    email: 'carol@startup.com',
    role: 'business',
    password: 'hashed_password_carol'
  };

  const investorUser = {
    _id: '65f01234567890abcdef2001',
    name: 'Investor Dave',
    email: 'dave@capital.com',
    role: 'investor',
    password: 'hashed_password_dave',
    savedBusinesses: []
  };

  const otherInvestorUser = {
    _id: '65f01234567890abcdef2002',
    name: 'Investor Emma',
    email: 'emma@capital.com',
    role: 'investor',
    password: 'hashed_password_emma',
    savedBusinesses: []
  };

  let tokenFounderWithProfile;
  let tokenOtherFounder;
  let tokenFounderWithoutProfile;
  let tokenInvestor;
  let tokenOtherInvestor;

  const businessAlice = {
    _id: '65f01234567890abcdef0001',
    owner: founderWithProfile._id,
    name: 'BioTech Innovations',
    tagline: 'Personalized cancer therapeutics',
    description: 'Oncology research platform.',
    industry: 'BioTech',
    country: 'Portugal',
    city: 'Lisbon',
    stage: 'Seed',
    revenueRange: '€50k - €200k ARR',
    fundingGoal: 500000,
    purpose: 'Clinical trials',
    isPublished: true,
    privatePitchLink: 'https://dataroom.example.com/biotech',
    contactEmail: 'alice@biotech.pt',
    createdAt: new Date('2026-01-10T10:00:00Z')
  };

  const businessBob = {
    _id: '65f01234567890abcdef0002',
    owner: otherFounder._id,
    name: 'CleanGrid Power',
    tagline: 'Flow battery energy storage',
    description: 'Smart renewable grid storage.',
    industry: 'CleanTech',
    country: 'Portugal',
    city: 'Porto',
    stage: 'Series A',
    revenueRange: '€500k - €1M ARR',
    fundingGoal: 1200000,
    purpose: 'Manufacturing',
    isPublished: true,
    privatePitchLink: 'https://dataroom.example.com/cleangrid',
    contactEmail: 'bob@cleangrid.pt',
    createdAt: new Date('2026-02-01T10:00:00Z')
  };

  const businessUnpublished = {
    _id: '65f01234567890abcdef0003',
    owner: '65f01234567890abcdef1099',
    name: 'Stealth AI Lab',
    tagline: 'Stealth project',
    description: 'Confidential algorithms.',
    industry: 'AI',
    country: 'Portugal',
    city: 'Lisbon',
    stage: 'Idea',
    revenueRange: 'Pre-revenue',
    fundingGoal: 300000,
    purpose: 'R&D',
    isPublished: false,
    privatePitchLink: 'https://dataroom.example.com/stealth',
    contactEmail: 'secret@stealth.pt',
    createdAt: new Date('2026-03-01T10:00:00Z')
  };

  let mockInterests = [];
  let userMap = {};
  let businessMap = {};

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
    tokenFounderWithProfile = signToken({
      userId: founderWithProfile._id,
      role: founderWithProfile.role
    });
    tokenOtherFounder = signToken({
      userId: otherFounder._id,
      role: otherFounder.role
    });
    tokenFounderWithoutProfile = signToken({
      userId: founderWithoutProfile._id,
      role: founderWithoutProfile.role
    });
    tokenInvestor = signToken({
      userId: investorUser._id,
      role: investorUser.role
    });
    tokenOtherInvestor = signToken({
      userId: otherInvestorUser._id,
      role: otherInvestorUser.role
    });
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  beforeEach(() => {
    // Saved businesses for investorUser includes:
    // - 1 published business (businessAlice)
    // - 1 unpublished business (businessUnpublished)
    // - 1 deleted business ID
    const deletedBusinessId = '65f01234567890abcdef9999';

    userMap = {
      [founderWithProfile._id]: { ...founderWithProfile },
      [otherFounder._id]: { ...otherFounder },
      [founderWithoutProfile._id]: { ...founderWithoutProfile },
      [investorUser._id]: {
        ...investorUser,
        savedBusinesses: [businessAlice._id, businessUnpublished._id, deletedBusinessId]
      },
      [otherInvestorUser._id]: { ...otherInvestorUser, savedBusinesses: [] }
    };

    businessMap = {
      [businessAlice._id]: { ...businessAlice },
      [businessBob._id]: { ...businessBob },
      [businessUnpublished._id]: { ...businessUnpublished }
    };

    // Distribution of interests:
    // 1. Investor Dave -> Alice (pending)
    // 2. Investor Dave -> Alice (accepted)
    // 3. Investor Emma -> Alice (accepted)
    // 4. Investor Emma -> Alice (declined)
    // Alice's business received: total 4 (pending: 1, accepted: 2, declined: 1)
    //
    // 5. Investor Dave -> Bob (pending)
    // 6. Investor Emma -> Bob (declined)
    // Bob's business received: total 2 (pending: 1, accepted: 0, declined: 1)
    //
    // Investor Dave sent:
    // - to Alice: pending (1), accepted (1)
    // - to Bob: pending (1)
    // Dave sent: total 3 (pending: 2, accepted: 1, declined: 0)
    mockInterests = [
      {
        _id: '65f01234567890abcdef8001',
        investor: investorUser._id,
        business: businessAlice._id,
        status: 'pending'
      },
      {
        _id: '65f01234567890abcdef8002',
        investor: investorUser._id,
        business: businessAlice._id,
        status: 'accepted'
      },
      {
        _id: '65f01234567890abcdef8003',
        investor: otherInvestorUser._id,
        business: businessAlice._id,
        status: 'accepted'
      },
      {
        _id: '65f01234567890abcdef8004',
        investor: otherInvestorUser._id,
        business: businessAlice._id,
        status: 'declined'
      },
      {
        _id: '65f01234567890abcdef8005',
        investor: investorUser._id,
        business: businessBob._id,
        status: 'pending'
      },
      {
        _id: '65f01234567890abcdef8006',
        investor: otherInvestorUser._id,
        business: businessBob._id,
        status: 'declined'
      }
    ];

    // Mock User.findById
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const u = userMap[String(id)];
      const chain = {
        select: jest.fn().mockImplementation(() => Promise.resolve(u ? { ...u } : null)),
        then: (resolve) => resolve(u ? { ...u } : null)
      };
      return chain;
    });

    // Mock Business.findOne
    jest.spyOn(Business, 'findOne').mockImplementation(async (query) => {
      if (query && query.owner) {
        const found = Object.values(businessMap).find(
          (b) => String(b.owner) === String(query.owner)
        );
        return found ? { ...found } : null;
      }
      return null;
    });

    // Mock Business.countDocuments
    jest.spyOn(Business, 'countDocuments').mockImplementation(async (query) => {
      let count = 0;
      for (const b of Object.values(businessMap)) {
        let match = true;
        if (query && query.isPublished !== undefined && b.isPublished !== query.isPublished) {
          match = false;
        }
        if (query && query._id && query._id.$in) {
          const ids = query._id.$in.map(String);
          if (!ids.includes(String(b._id))) {
            match = false;
          }
        }
        if (match) count += 1;
      }
      return count;
    });

    // Mock Interest.aggregate
    jest.spyOn(Interest, 'aggregate').mockImplementation(async (pipeline) => {
      const matchStage = pipeline.find((stage) => stage.$match)?.$match || {};
      const groupStage = pipeline.find((stage) => stage.$group)?.$group;

      if (!groupStage) return [];

      // Filter in-memory interests according to match criteria
      const filtered = mockInterests.filter((item) => {
        let match = true;
        if (matchStage.business && String(item.business) !== String(matchStage.business)) {
          match = false;
        }
        if (matchStage.investor && String(item.investor) !== String(matchStage.investor)) {
          match = false;
        }
        return match;
      });

      // Group by status
      const counts = {};
      for (const item of filtered) {
        counts[item.status] = (counts[item.status] || 0) + 1;
      }

      return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Authentication Guardrails', () => {
    it('should return HTTP 401 when request is unauthenticated', async () => {
      const res = await request(app).get('/api/dashboard/stats');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 401 when authorization token is invalid', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer invalid_or_corrupted_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Business Dashboard Statistics', () => {
    it('should return accurate business stats for a founder with an active published profile', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenFounderWithProfile}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe('business');
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.profileExists).toBe(true);
      expect(res.body.stats.isPublished).toBe(true);

      // Alice's business received: 1 pending, 2 accepted, 1 declined = total 4
      expect(res.body.stats.interestsReceived).toEqual({
        total: 4,
        pending: 1,
        accepted: 2,
        declined: 1
      });
    });

    it('should isolate received interest statistics strictly to the authenticated founder\'s business', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenOtherFounder}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe('business');
      expect(res.body.stats.profileExists).toBe(true);

      // Bob's business received: 1 pending, 0 accepted, 1 declined = total 2
      expect(res.body.stats.interestsReceived).toEqual({
        total: 2,
        pending: 1,
        accepted: 0,
        declined: 1
      });
    });

    it('should return HTTP 200 with zero-valued counters when a founder has no business profile yet', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenFounderWithoutProfile}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe('business');
      expect(res.body.stats).toEqual({
        profileExists: false,
        isPublished: false,
        interestsReceived: {
          total: 0,
          pending: 0,
          accepted: 0,
          declined: 0
        }
      });
    });

    it('should never expose private business fields (privatePitchLink, contactEmail) in dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenFounderWithProfile}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.privatePitchLink).toBeUndefined();
      expect(res.body.stats.contactEmail).toBeUndefined();
      expect(res.body.stats.business).toBeUndefined();
    });
  });

  describe('3. Investor Dashboard Statistics', () => {
    it('should return accurate investor stats for an active investor', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe('investor');
      expect(res.body.stats).toBeDefined();

      // 2 published businesses exist in catalog (businessAlice, businessBob)
      expect(res.body.stats.availableBusinesses).toBe(2);

      // Saved businesses: investorUser saved 3 IDs, but only businessAlice is published and existing
      expect(res.body.stats.savedBusinesses).toBe(1);

      // Dave sent: 2 pending, 1 accepted, 0 declined = total 3
      expect(res.body.stats.interestsSent).toEqual({
        total: 3,
        pending: 2,
        accepted: 1,
        declined: 0
      });
    });

    it('should ensure missing status groups produce zero rather than undefined values', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      // Dave has 0 declined interests
      expect(res.body.stats.interestsSent.declined).toBe(0);
      expect(res.body.stats.interestsSent.declined).not.toBeUndefined();
    });

    it('should isolate sent interests strictly to the authenticated investor', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenOtherInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('investor');

      // Emma sent: 0 pending, 1 accepted, 2 declined = total 3
      expect(res.body.stats.interestsSent).toEqual({
        total: 3,
        pending: 0,
        accepted: 1,
        declined: 2
      });
    });

    it('should return zero-valued counters when an investor has no activity or saved businesses', async () => {
      // Clear activity for Emma
      mockInterests = mockInterests.filter(
        (i) => String(i.investor) !== String(otherInvestorUser._id)
      );

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenOtherInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.savedBusinesses).toBe(0);
      expect(res.body.stats.interestsSent).toEqual({
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0
      });
    });

    it('should never expose passwords, password hashes, or token secrets in responses', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.password).toBeUndefined();
      expect(res.body.stats.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/hashed_password/);
    });
  });

  describe('4. Security & Role Independence', () => {
    it('should reject arbitrary query parameters attempting to override user identity', async () => {
      // Attacker attempts to pass another user's ID via query parameter
      const res = await request(app)
        .get(`/api/dashboard/stats?userId=${founderWithProfile._id}&businessId=${businessAlice._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      // Still returns investor role based on verified token
      expect(res.body.role).toBe('investor');
      expect(res.body.stats.availableBusinesses).toBe(2);
      expect(res.body.stats.interestsReceived).toBeUndefined();
    });
  });
});
