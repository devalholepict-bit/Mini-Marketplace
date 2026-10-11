const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Business = require('../src/models/Business');
const { signToken } = require('../src/utils/jwt');

describe('Business Profile Management (Stage 4 Supertest Integration)', () => {
  const originalSecret = process.env.JWT_SECRET;
  const testSecret = 'business_test_jwt_secret_antigravity';

  const businessUser1 = {
    _id: '65f01234567890abcdef1001',
    name: 'Founder One',
    email: 'founder1@example.com',
    role: 'business'
  };

  const businessUser2 = {
    _id: '65f01234567890abcdef1002',
    name: 'Founder Two',
    email: 'founder2@example.com',
    role: 'business'
  };

  const investorUser = {
    _id: '65f01234567890abcdef2001',
    name: 'Investor One',
    email: 'investor@example.com',
    role: 'investor'
  };

  let tokenBusiness1;
  let tokenBusiness2;
  let tokenInvestor;

  // In-memory store for mocked Business documents
  let businessStore = [];

  const validProfilePayload = {
    name: 'EcoEnergy Labs',
    tagline: 'Next-gen solar storage technologies for modern grids',
    description: 'We develop high-density flow batteries for commercial and residential energy storage.',
    industry: 'CleanTech',
    country: 'Portugal',
    city: 'Lisbon',
    stage: 'Seed',
    revenueRange: '€50k - €200k ARR',
    fundingGoal: 500000,
    purpose: 'R&D expansion and CE certification testing',
    privatePitchLink: 'https://dataroom.example.com/ecoenergy',
    contactEmail: 'contact@ecoenergy.pt'
  };

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
    tokenBusiness1 = signToken({ userId: businessUser1._id, role: businessUser1.role });
    tokenBusiness2 = signToken({ userId: businessUser2._id, role: businessUser2.role });
    tokenInvestor = signToken({ userId: investorUser._id, role: investorUser.role });
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  beforeEach(() => {
    businessStore = [];

    // Mock User.findById for authentication middleware
    jest.spyOn(User, 'findById').mockImplementation(async (id) => {
      const idStr = String(id);
      if (idStr === String(businessUser1._id)) return businessUser1;
      if (idStr === String(businessUser2._id)) return businessUser2;
      if (idStr === String(investorUser._id)) return investorUser;
      return null;
    });

    // Mock Business.findOne
    jest.spyOn(Business, 'findOne').mockImplementation((query) => {
      const found = businessStore.find((b) => String(b.owner) === String(query.owner));
      if (!found) return Promise.resolve(null);

      // Return document-like object with save method
      const doc = {
        ...found,
        save: jest.fn().mockImplementation(async function () {
          const idx = businessStore.findIndex((b) => String(b.owner) === String(query.owner));
          if (idx !== -1) {
            businessStore[idx] = { ...this };
          }
          return this;
        })
      };
      return Promise.resolve(doc);
    });

    // Mock Business.create
    jest.spyOn(Business, 'create').mockImplementation(async (data) => {
      const newDoc = {
        _id: '65f01234567890abcdef9999',
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        save: jest.fn().mockImplementation(async function () {
          return this;
        })
      };
      businessStore.push(newDoc);
      return newDoc;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1 & 2. Authentication and Role Authorization', () => {
    it('should return HTTP 401 for unauthenticated requests on all business endpoints', async () => {
      const getRes = await request(app).get('/api/businesses/me');
      expect(getRes.status).toBe(401);

      const putRes = await request(app).put('/api/businesses/me').send(validProfilePayload);
      expect(putRes.status).toBe(401);

      const patchRes = await request(app)
        .patch('/api/businesses/me/publish')
        .send({ isPublished: true });
      expect(patchRes.status).toBe(401);
    });

    it('should return HTTP 403 when an investor attempts to access business-owner endpoints', async () => {
      const getRes = await request(app)
        .get('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenInvestor}`);
      expect(getRes.status).toBe(403);
      expect(getRes.body.message).toMatch(/Forbidden/i);

      const putRes = await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenInvestor}`)
        .send(validProfilePayload);
      expect(putRes.status).toBe(403);

      const patchRes = await request(app)
        .patch('/api/businesses/me/publish')
        .set('Authorization', `Bearer ${tokenInvestor}`)
        .send({ isPublished: true });
      expect(patchRes.status).toBe(403);
    });
  });

  describe('3 & 4. PUT /api/businesses/me Upsert Lifecycle', () => {
    it('should return HTTP 404 when querying GET /api/businesses/me before a profile exists', async () => {
      const res = await request(app)
        .get('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should create a valid profile on initial PUT and return HTTP 201 with isPublished defaulting to false', async () => {
      const res = await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(validProfilePayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.business).toHaveProperty('name', 'EcoEnergy Labs');
      expect(res.body.business).toHaveProperty('owner', businessUser1._id);
      expect(res.body.business).toHaveProperty('isPublished', false);
      expect(res.body.business).toHaveProperty('privatePitchLink', validProfilePayload.privatePitchLink);
      expect(res.body.business).toHaveProperty('contactEmail', 'contact@ecoenergy.pt');
    });

    it('should update the same profile on subsequent PUT and return HTTP 200 without creating duplicates', async () => {
      // First PUT: create
      await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(validProfilePayload);

      expect(businessStore.length).toBe(1);

      // Second PUT: update
      const updatedPayload = {
        ...validProfilePayload,
        name: 'EcoEnergy Technologies',
        fundingGoal: 750000
      };

      const res = await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(updatedPayload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.business).toHaveProperty('name', 'EcoEnergy Technologies');
      expect(res.body.business).toHaveProperty('fundingGoal', 750000);
      expect(businessStore.length).toBe(1); // Profile count remains 1
    });

    it('should retrieve the complete owner profile via GET /api/businesses/me including private fields', async () => {
      // Create profile
      await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(validProfilePayload);

      const res = await request(app)
        .get('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.business).toHaveProperty('privatePitchLink', validProfilePayload.privatePitchLink);
      expect(res.body.business).toHaveProperty('contactEmail', validProfilePayload.contactEmail);
    });
  });

  describe('5 & 7. Isolation and Protected Field Injection Prevention', () => {
    it('should keep a different business user’s profile untouched and isolated', async () => {
      // Create profile for Business User 1
      await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(validProfilePayload);

      // Business User 2 queries their profile -> should be 404
      const res2 = await request(app)
        .get('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness2}`);

      expect(res2.status).toBe(404);
      expect(res2.body.message).toMatch(/not found/i);
    });

    it('should ignore attempted owner reassignment and protected fields in request body', async () => {
      const maliciousPayload = {
        ...validProfilePayload,
        owner: '65f01234567890abcdef9999', // attempted owner override
        isPublished: true, // attempted auto-publish bypass
        _id: 'fake_id_override'
      };

      const res = await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(maliciousPayload);

      expect(res.status).toBe(201);
      // Owner must still be businessUser1._id
      expect(String(res.body.business.owner)).toBe(String(businessUser1._id));
      // isPublished must remain false on creation despite payload
      expect(res.body.business.isPublished).toBe(false);
    });
  });

  describe('6. Input Validation (Zod)', () => {
    it('should reject invalid contactEmail with HTTP 400', async () => {
      const invalidPayload = {
        ...validProfilePayload,
        contactEmail: 'not-an-email'
      };

      const res = await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.errors.some((e) => e.field === 'contactEmail')).toBe(true);
    });

    it('should reject negative or zero fundingGoal with HTTP 400', async () => {
      const invalidPayload = {
        ...validProfilePayload,
        fundingGoal: -1000
      };

      const res = await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'fundingGoal')).toBe(true);
    });
  });

  describe('8, 9 & 10. Publication Lifecycle (PATCH /api/businesses/me/publish)', () => {
    it('should return HTTP 404 when attempting to publish before creating a profile', async () => {
      const res = await request(app)
        .patch('/api/businesses/me/publish')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send({ isPublished: true });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should allow publishing and unpublishing an existing profile with HTTP 200', async () => {
      // 1. Create profile (defaults to false)
      await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(validProfilePayload);

      // 2. Publish
      const publishRes = await request(app)
        .patch('/api/businesses/me/publish')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send({ isPublished: true });

      expect(publishRes.status).toBe(200);
      expect(publishRes.body.business.isPublished).toBe(true);

      // 3. Unpublish
      const unpublishRes = await request(app)
        .patch('/api/businesses/me/publish')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send({ isPublished: false });

      expect(unpublishRes.status).toBe(200);
      expect(unpublishRes.body.business.isPublished).toBe(false);
    });

    it('should preserve isPublished = true across subsequent profile PUT updates', async () => {
      // 1. Create
      await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(validProfilePayload);

      // 2. Publish
      await request(app)
        .patch('/api/businesses/me/publish')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send({ isPublished: true });

      // 3. Update description via PUT
      const updateRes = await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send({
          ...validProfilePayload,
          description: 'Updated description for investors with new pilot results.'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.business.description).toBe(
        'Updated description for investors with new pilot results.'
      );
      // Crucial: publication status must remain true
      expect(updateRes.body.business.isPublished).toBe(true);
    });
  });

  describe('11. Credential and Secret Safety in Responses', () => {
    it('should never include password hashes, tokens, or JWT secrets in business responses', async () => {
      const res = await request(app)
        .put('/api/businesses/me')
        .set('Authorization', `Bearer ${tokenBusiness1}`)
        .send(validProfilePayload);

      const jsonStr = JSON.stringify(res.body);
      expect(jsonStr).not.toContain('password');
      expect(jsonStr).not.toContain(testSecret);
    });
  });
});
