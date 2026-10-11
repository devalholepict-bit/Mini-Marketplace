const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Business = require('../src/models/Business');
const { signToken } = require('../src/utils/jwt');

describe('Saved Businesses API (Stage 6 Integration)', () => {
  const originalSecret = process.env.JWT_SECRET;
  const testSecret = 'saved_test_jwt_secret_antigravity';

  const investorUser = {
    _id: '65f01234567890abcdef2001',
    name: 'Investor One',
    email: 'investor1@example.com',
    role: 'investor',
    savedBusinesses: []
  };

  const otherInvestorUser = {
    _id: '65f01234567890abcdef2002',
    name: 'Investor Two',
    email: 'investor2@example.com',
    role: 'investor',
    savedBusinesses: []
  };

  const businessUser = {
    _id: '65f01234567890abcdef1001',
    name: 'Founder One',
    email: 'founder@example.com',
    role: 'business'
  };

  let tokenInvestor;
  let tokenOtherInvestor;
  let tokenBusiness;

  const publishedBusiness = {
    _id: '65f01234567890abcdef0001',
    owner: businessUser._id,
    name: 'SolarGrid Technologies',
    tagline: 'Smart inverters for distributed solar microgrids',
    description: 'Hardware and software systems for resilient microgrid management.',
    industry: 'CleanTech',
    country: 'Portugal',
    city: 'Lisbon',
    stage: 'Seed',
    revenueRange: '€50k - €200k ARR',
    fundingGoal: 300000,
    purpose: 'R&D',
    isPublished: true,
    privatePitchLink: 'https://dataroom.example.com/solargrid',
    contactEmail: 'contact@solargrid.pt',
    createdAt: new Date('2026-01-15T10:00:00Z')
  };

  const publishedBusiness2 = {
    _id: '65f01234567890abcdef0002',
    owner: '65f01234567890abcdef1002',
    name: 'AgriWater Sensor',
    tagline: 'IoT soil moisture sensors',
    description: 'Precision irrigation sensors conserving up to 40% water.',
    industry: 'AgriTech',
    country: 'Portugal',
    city: 'Porto',
    stage: 'Pre-Seed',
    revenueRange: 'Pre-revenue',
    fundingGoal: 150000,
    purpose: 'Production',
    isPublished: true,
    privatePitchLink: 'https://dataroom.example.com/agriwater',
    contactEmail: 'hello@agriwater.pt',
    createdAt: new Date('2026-02-10T10:00:00Z')
  };

  const unpublishedBusiness = {
    _id: '65f01234567890abcdef0003',
    owner: '65f01234567890abcdef1003',
    name: 'Secret Stealth AI',
    tagline: 'Stealth project in healthcare',
    description: 'Not yet ready for public discovery.',
    industry: 'HealthTech',
    country: 'Portugal',
    city: 'Lisbon',
    stage: 'Idea',
    revenueRange: 'Pre-revenue',
    fundingGoal: 500000,
    purpose: 'Incubation',
    isPublished: false,
    privatePitchLink: 'https://dataroom.example.com/stealth',
    contactEmail: 'stealth@example.pt',
    createdAt: new Date('2026-03-01T10:00:00Z')
  };

  // User state mock store
  let userStore = {};
  let businessList = [];

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
    tokenInvestor = signToken({ userId: investorUser._id, role: investorUser.role });
    tokenOtherInvestor = signToken({ userId: otherInvestorUser._id, role: otherInvestorUser.role });
    tokenBusiness = signToken({ userId: businessUser._id, role: businessUser.role });
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  beforeEach(() => {
    userStore = {
      [investorUser._id]: { ...investorUser, savedBusinesses: [] },
      [otherInvestorUser._id]: { ...otherInvestorUser, savedBusinesses: [] },
      [businessUser._id]: { ...businessUser }
    };

    businessList = [publishedBusiness, publishedBusiness2, unpublishedBusiness];

    // Mock User.findById
    jest.spyOn(User, 'findById').mockImplementation(async (id) => {
      const u = userStore[String(id)];
      return u ? { ...u } : null;
    });

    // Mock User.findByIdAndUpdate
    jest.spyOn(User, 'findByIdAndUpdate').mockImplementation(async (id, update, options) => {
      const u = userStore[String(id)];
      if (!u) return null;

      if (update.$addToSet && update.$addToSet.savedBusinesses) {
        const itemToAdd = String(update.$addToSet.savedBusinesses);
        const existing = u.savedBusinesses.map(String);
        if (!existing.includes(itemToAdd)) {
          u.savedBusinesses.push(update.$addToSet.savedBusinesses);
        }
      }

      if (update.$pull && update.$pull.savedBusinesses) {
        const itemToRemove = String(update.$pull.savedBusinesses);
        u.savedBusinesses = u.savedBusinesses.filter((b) => String(b) !== itemToRemove);
      }

      userStore[String(id)] = u;
      return { ...u };
    });

    // Mock Business.findById
    jest.spyOn(Business, 'findById').mockImplementation(async (id) => {
      const found = businessList.find((b) => String(b._id) === String(id));
      return found ? { ...found } : null;
    });

    // Mock Business.find
    jest.spyOn(Business, 'find').mockImplementation((filter) => {
      let results = [...businessList];

      if (filter && filter._id && filter._id.$in) {
        const ids = filter._id.$in.map(String);
        results = results.filter((b) => ids.includes(String(b._id)));
      }

      if (filter && filter.isPublished !== undefined) {
        results = results.filter((b) => b.isPublished === filter.isPublished);
      }

      const chain = {
        select: jest.fn().mockImplementation(() => Promise.resolve(results)),
        then: (resolve) => resolve(results)
      };

      return chain;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Authentication & Role Authorization', () => {
    it('should return HTTP 401 when unauthenticated request accesses POST /api/investor/saved/:businessId', async () => {
      const res = await request(app)
        .post(`/api/investor/saved/${publishedBusiness._id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 401 when unauthenticated request accesses GET /api/investor/saved', async () => {
      const res = await request(app)
        .get('/api/investor/saved');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 401 when unauthenticated request accesses DELETE /api/investor/saved/:businessId', async () => {
      const res = await request(app)
        .delete(`/api/investor/saved/${publishedBusiness._id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 403 when business role attempts to access saved endpoints', async () => {
      const resPost = await request(app)
        .post(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenBusiness}`);

      expect(resPost.status).toBe(403);
      expect(resPost.body.success).toBe(false);

      const resGet = await request(app)
        .get('/api/investor/saved')
        .set('Authorization', `Bearer ${tokenBusiness}`);

      expect(resGet.status).toBe(403);

      const resDelete = await request(app)
        .delete(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenBusiness}`);

      expect(resDelete.status).toBe(403);
    });
  });

  describe('2. POST /api/investor/saved/:businessId', () => {
    it('should allow an authenticated investor to save a published business', async () => {
      const res = await request(app)
        .post(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/saved/i);
      expect(res.body.savedBusinesses.map(String)).toContain(publishedBusiness._id);
    });

    it('should be idempotent: saving the same business twice does not create duplicates', async () => {
      // First save
      await request(app)
        .post(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      // Second save
      const res2 = await request(app)
        .post(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      const occurrences = res2.body.savedBusinesses.filter(
        (id) => String(id) === String(publishedBusiness._id)
      ).length;
      expect(occurrences).toBe(1);
    });

    it('should reject saving an unpublished business with HTTP 404', async () => {
      const res = await request(app)
        .post(`/api/investor/saved/${unpublishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should return HTTP 404 when saving a non-existent business', async () => {
      const nonExistentId = '65f01234567890abcdef9999';
      const res = await request(app)
        .post(`/api/investor/saved/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 400 for a malformed businessId parameter', async () => {
      const res = await request(app)
        .post('/api/investor/saved/invalid-hex-id')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. GET /api/investor/saved', () => {
    it('should return an empty list when investor has no saved businesses', async () => {
      const res = await request(app)
        .get('/api/investor/saved')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('should list only the authenticated investor\'s saved businesses and exclude others', async () => {
      // Save for investor 1
      await request(app)
        .post(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      // Save for investor 2
      await request(app)
        .post(`/api/investor/saved/${publishedBusiness2._id}`)
        .set('Authorization', `Bearer ${tokenOtherInvestor}`);

      // Query investor 1
      const res1 = await request(app)
        .get('/api/investor/saved')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res1.status).toBe(200);
      expect(res1.body.count).toBe(1);
      expect(res1.body.data[0].id).toBe(publishedBusiness._id);

      // Query investor 2
      const res2 = await request(app)
        .get('/api/investor/saved')
        .set('Authorization', `Bearer ${tokenOtherInvestor}`);

      expect(res2.status).toBe(200);
      expect(res2.body.count).toBe(1);
      expect(res2.body.data[0].id).toBe(publishedBusiness2._id);
    });

    it('should return public-safe fields only, never exposing privatePitchLink or contactEmail', async () => {
      await request(app)
        .post(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      const res = await request(app)
        .get('/api/investor/saved')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      const item = res.body.data[0];
      expect(item).toHaveProperty('id', publishedBusiness._id);
      expect(item).toHaveProperty('name', publishedBusiness.name);
      expect(item).toHaveProperty('tagline', publishedBusiness.tagline);
      expect(item).toHaveProperty('industry', publishedBusiness.industry);
      expect(item).toHaveProperty('fundingGoal', publishedBusiness.fundingGoal);

      // Privacy checks
      expect(item.privatePitchLink).toBeUndefined();
      expect(item.contactEmail).toBeUndefined();
    });

    it('should safely omit unpublished businesses even if their ID exists in savedBusinesses', async () => {
      // Forcefully set savedBusinesses to include an unpublished business
      userStore[investorUser._id].savedBusinesses = [
        publishedBusiness._id,
        unpublishedBusiness._id
      ];

      const res = await request(app)
        .get('/api/investor/saved')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].id).toBe(publishedBusiness._id);
    });

    it('should safely handle missing or deleted business IDs without crashing', async () => {
      const deletedId = '65f01234567890abcdef7777';
      userStore[investorUser._id].savedBusinesses = [
        publishedBusiness._id,
        deletedId
      ];

      const res = await request(app)
        .get('/api/investor/saved')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].id).toBe(publishedBusiness._id);
    });
  });

  describe('4. DELETE /api/investor/saved/:businessId', () => {
    it('should remove the business from the authenticated investor\'s saved list', async () => {
      // First save
      await request(app)
        .post(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      // Unsave
      const res = await request(app)
        .delete(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/removed/i);
      expect(res.body.savedBusinesses.map(String)).not.toContain(publishedBusiness._id);
    });

    it('should be idempotent: unsaving an already absent business succeeds safely', async () => {
      const res = await request(app)
        .delete(`/api/investor/saved/${publishedBusiness._id}`)
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return HTTP 400 when businessId is malformed', async () => {
      const res = await request(app)
        .delete('/api/investor/saved/not-a-valid-id')
        .set('Authorization', `Bearer ${tokenInvestor}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
