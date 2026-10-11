const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Business = require('../src/models/Business');
const Interest = require('../src/models/Interest');
const { signToken } = require('../src/utils/jwt');

describe('Interest Management API (Stage 6 Integration)', () => {
  const originalSecret = process.env.JWT_SECRET;
  const testSecret = 'interest_test_jwt_secret_antigravity';

  // Test users
  const investor1 = {
    _id: '65f01234567890abcdef2001',
    name: 'Investor Alice',
    email: 'alice@investor.com',
    role: 'investor',
    password: 'hashed_password_alice'
  };

  const investor2 = {
    _id: '65f01234567890abcdef2002',
    name: 'Investor Bob',
    email: 'bob@investor.com',
    role: 'investor',
    password: 'hashed_password_bob'
  };

  const founder1 = {
    _id: '65f01234567890abcdef1001',
    name: 'Founder Carol',
    email: 'carol@startup.com',
    role: 'business',
    password: 'hashed_password_carol'
  };

  const founder2 = {
    _id: '65f01234567890abcdef1002',
    name: 'Founder Dave',
    email: 'dave@startup.com',
    role: 'business',
    password: 'hashed_password_dave'
  };

  const founderWithoutBusiness = {
    _id: '65f01234567890abcdef1003',
    name: 'Founder Emma',
    email: 'emma@newbie.com',
    role: 'business'
  };

  let tokenInvestor1;
  let tokenInvestor2;
  let tokenFounder1;
  let tokenFounder2;
  let tokenFounderWithoutBusiness;

  // Businesses
  const businessCarol = {
    _id: '65f01234567890abcdef0001',
    owner: founder1._id,
    name: 'QuantumCompute Labs',
    tagline: 'Room-temperature superconducting processors',
    description: 'Breakthrough quantum processing unit architectures.',
    industry: 'DeepTech',
    country: 'Portugal',
    city: 'Lisbon',
    stage: 'Seed',
    revenueRange: 'Pre-revenue',
    fundingGoal: 1000000,
    purpose: 'Cleanroom fab access',
    isPublished: true,
    privatePitchLink: 'https://dataroom.example.com/quantum',
    contactEmail: 'carol@quantumcompute.pt',
    createdAt: new Date('2026-01-10T10:00:00Z')
  };

  const businessDave = {
    _id: '65f01234567890abcdef0002',
    owner: founder2._id,
    name: 'AgriRobotics AI',
    tagline: 'Autonomous vineyard pruning drones',
    description: 'Precision robotics for high-value agricultural crops.',
    industry: 'AgriTech',
    country: 'Portugal',
    city: 'Porto',
    stage: 'Series A',
    revenueRange: '€500k - €1M ARR',
    fundingGoal: 2000000,
    purpose: 'EU scale-out',
    isPublished: true,
    privatePitchLink: 'https://dataroom.example.com/agrirobotics',
    contactEmail: 'dave@agrirobotics.pt',
    createdAt: new Date('2026-02-01T10:00:00Z')
  };

  const unpublishedBusiness = {
    _id: '65f01234567890abcdef0003',
    owner: founder1._id,
    name: 'Unpublished Stealth Bio',
    tagline: 'Stealth project',
    description: 'Confidential genetics sequencing.',
    industry: 'BioTech',
    country: 'Portugal',
    city: 'Lisbon',
    stage: 'Idea',
    revenueRange: 'Pre-revenue',
    fundingGoal: 500000,
    purpose: 'R&D',
    isPublished: false,
    privatePitchLink: 'https://dataroom.example.com/bio',
    contactEmail: 'secret@bio.pt',
    createdAt: new Date('2026-03-01T10:00:00Z')
  };

  // State stores
  let mockInterests = [];
  let userMap = {};
  let businessMap = {};

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
    tokenInvestor1 = signToken({ userId: investor1._id, role: investor1.role });
    tokenInvestor2 = signToken({ userId: investor2._id, role: investor2.role });
    tokenFounder1 = signToken({ userId: founder1._id, role: founder1.role });
    tokenFounder2 = signToken({ userId: founder2._id, role: founder2.role });
    tokenFounderWithoutBusiness = signToken({
      userId: founderWithoutBusiness._id,
      role: founderWithoutBusiness.role
    });
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  beforeEach(() => {
    mockInterests = [];
    userMap = {
      [investor1._id]: investor1,
      [investor2._id]: investor2,
      [founder1._id]: founder1,
      [founder2._id]: founder2,
      [founderWithoutBusiness._id]: founderWithoutBusiness
    };
    businessMap = {
      [businessCarol._id]: businessCarol,
      [businessDave._id]: businessDave,
      [unpublishedBusiness._id]: unpublishedBusiness
    };

    // Mock User.findById
    jest.spyOn(User, 'findById').mockImplementation(async (id) => {
      const u = userMap[String(id)];
      return u ? { ...u } : null;
    });

    // Mock Business.findById
    jest.spyOn(Business, 'findById').mockImplementation(async (id) => {
      const b = businessMap[String(id)];
      return b ? { ...b } : null;
    });

    // Mock Business.findOne
    jest.spyOn(Business, 'findOne').mockImplementation(async (query) => {
      if (query && query.owner) {
        const found = Object.values(businessMap).find(
          (b) => String(b.owner) === String(query.owner) && b.isPublished !== false
        ) || Object.values(businessMap).find(
          (b) => String(b.owner) === String(query.owner)
        );
        return found ? { ...found } : null;
      }
      return null;
    });

    // Mock Interest.findById
    jest.spyOn(Interest, 'findById').mockImplementation(async (id) => {
      const found = mockInterests.find((i) => String(i._id) === String(id));
      return found ? { ...found } : null;
    });

    // Mock Interest.findOne
    jest.spyOn(Interest, 'findOne').mockImplementation(async (query) => {
      const found = mockInterests.find((i) => {
        let match = true;
        if (query.investor && String(i.investor) !== String(query.investor)) match = false;
        if (query.business && String(i.business) !== String(query.business)) match = false;
        if (query.status && i.status !== query.status) match = false;
        return match;
      });
      return found ? { ...found } : null;
    });

    // Mock Interest.create
    jest.spyOn(Interest, 'create').mockImplementation(async (docData) => {
      // Enforce unique compound index simulation
      const duplicate = mockInterests.find(
        (i) =>
          String(i.investor) === String(docData.investor) &&
          String(i.business) === String(docData.business)
      );
      if (duplicate) {
        const err = new Error('E11000 duplicate key error collection: interests index: investor_1_business_1 dup key');
        err.code = 11000;
        err.keyPattern = { investor: 1, business: 1 };
        throw err;
      }

      const newInterest = {
        _id: '65f01234567890abcdef800' + (mockInterests.length + 1),
        ...docData,
        status: docData.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockInterests.push(newInterest);
      return newInterest;
    });

    // Mock Interest.findOneAndUpdate
    jest.spyOn(Interest, 'findOneAndUpdate').mockImplementation(async (query, update, options) => {
      const index = mockInterests.findIndex((i) => {
        let match = true;
        if (query._id && String(i._id) !== String(query._id)) match = false;
        if (query.business && String(i.business) !== String(query.business)) match = false;
        if (query.status && i.status !== query.status) match = false;
        return match;
      });

      if (index === -1) return null;

      if (update.$set) {
        mockInterests[index] = {
          ...mockInterests[index],
          ...update.$set,
          updatedAt: new Date()
        };
      }

      return { ...mockInterests[index] };
    });

    // Mock Interest.find (with sort and populate chaining)
    jest.spyOn(Interest, 'find').mockImplementation((filter) => {
      let filtered = mockInterests.filter((i) => {
        let match = true;
        if (filter.investor && String(i.investor) !== String(filter.investor)) match = false;
        if (filter.business && String(i.business) !== String(filter.business)) match = false;
        return match;
      });

      const chain = {
        sort: jest.fn().mockImplementation(() => chain),
        populate: jest.fn().mockImplementation(({ path, select }) => {
          filtered = filtered.map((item) => {
            const copy = { ...item };
            if (path === 'business') {
              const b = businessMap[String(item.business)];
              copy.business = b ? { ...b } : null;
            } else if (path === 'investor') {
              const u = userMap[String(item.investor)];
              copy.investor = u ? { _id: u._id, name: u.name, email: u.email } : null;
            }
            return copy;
          });
          return chain;
        }),
        then: (resolve) => resolve(filtered)
      };

      return chain;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Authentication and Role Authorization', () => {
    it('should return HTTP 401 when creating interest without authentication', async () => {
      const res = await request(app)
        .post('/api/interests')
        .send({ businessId: businessCarol._id, message: 'Interested in seed round.' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 403 when a business role attempts to create an investor interest', async () => {
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ businessId: businessDave._id, message: 'Founder trying to invest.' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 403 when a business role attempts to access /api/interests/sent', async () => {
      const res = await request(app)
        .get('/api/interests/sent')
        .set('Authorization', `Bearer ${tokenFounder1}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 403 when an investor role attempts to access /api/interests/received', async () => {
      const res = await request(app)
        .get('/api/interests/received')
        .set('Authorization', `Bearer ${tokenInvestor1}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 403 when an investor role attempts to update interest status', async () => {
      const res = await request(app)
        .patch('/api/interests/65f01234567890abcdef8001/status')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. POST /api/interests (Create Interest)', () => {
    it('should allow an investor to submit an interest in a published business', async () => {
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: businessCarol._id,
          message: 'We are leading deep-tech seed rounds and would love to review your deck.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.investor).toBe(investor1._id);
      expect(res.body.data.business).toBe(businessCarol._id);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.message).toBe('We are leading deep-tech seed rounds and would love to review your deck.');
    });

    it('should reject creation with HTTP 404 for an unpublished business', async () => {
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: unpublishedBusiness._id,
          message: 'Interested in stealth project.'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should reject creation with HTTP 404 for a non-existent business', async () => {
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: '65f01234567890abcdef9999',
          message: 'Interested in non-existent company.'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation with HTTP 400 for empty or missing message', async () => {
      const res1 = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: businessCarol._id,
          message: '   '
        });

      expect(res1.status).toBe(400);
      expect(res1.body.success).toBe(false);

      const res2 = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: businessCarol._id
        });

      expect(res2.status).toBe(400);
      expect(res2.body.success).toBe(false);
    });

    it('should reject creation with HTTP 400 when message exceeds 1000 characters', async () => {
      const longMessage = 'A'.repeat(1001);
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: businessCarol._id,
          message: longMessage
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation with HTTP 400 when malformed businessId is provided', async () => {
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: 'invalid-id-format',
          message: 'Hello founders.'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject client attempt to inject unauthorized fields (investor, status)', async () => {
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: businessCarol._id,
          message: 'Valid message.',
          status: 'accepted',
          investor: investor2._id
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 409 Conflict when submitting duplicate interest (application check)', async () => {
      // First submission
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: businessCarol._id,
          message: 'First submission.'
        });

      // Second submission
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: businessCarol._id,
          message: 'Duplicate attempt.'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already submitted/i);
    });

    it('should return HTTP 409 Conflict when MongoDB throws E11000 duplicate key error under concurrency', async () => {
      // Bypass app pre-check by mocking findOne to return null, forcing Interest.create to hit E11000
      jest.spyOn(Interest, 'findOne').mockResolvedValueOnce(null);

      mockInterests.push({
        _id: 'existing_id',
        investor: investor1._id,
        business: businessCarol._id,
        status: 'pending'
      });

      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: businessCarol._id,
          message: 'Concurrent race submission.'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already submitted/i);
    });
  });

  describe('3. GET /api/interests/sent (Investor Sent Interests)', () => {
    it('should return only the authenticated investor\'s sent interests', async () => {
      // Investor 1 expresses interest in Carol
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({ businessId: businessCarol._id, message: 'Alice to Carol' });

      // Investor 2 expresses interest in Dave
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor2}`)
        .send({ businessId: businessDave._id, message: 'Bob to Dave' });

      const res = await request(app)
        .get('/api/interests/sent')
        .set('Authorization', `Bearer ${tokenInvestor1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].message).toBe('Alice to Carol');
      expect(res.body.data[0].business.id).toBe(businessCarol._id);
    });

    it('should return public-safe business fields without privatePitchLink or contactEmail', async () => {
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({ businessId: businessCarol._id, message: 'Deck request' });

      const res = await request(app)
        .get('/api/interests/sent')
        .set('Authorization', `Bearer ${tokenInvestor1}`);

      expect(res.status).toBe(200);
      const interest = res.body.data[0];
      expect(interest.business).toBeDefined();
      expect(interest.business.name).toBe(businessCarol.name);
      expect(interest.business.privatePitchLink).toBeUndefined();
      expect(interest.business.contactEmail).toBeUndefined();
    });

    it('should handle deleted referenced businesses safely without crashing', async () => {
      mockInterests.push({
        _id: '65f01234567890abcdef8999',
        investor: investor1._id,
        business: '65f01234567890abcdef7777', // Deleted business ID
        message: 'Old expression of interest',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await request(app)
        .get('/api/interests/sent')
        .set('Authorization', `Bearer ${tokenInvestor1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const deletedItem = res.body.data.find((d) => d.id === '65f01234567890abcdef8999');
      expect(deletedItem).toBeDefined();
      expect(deletedItem.business).toBeNull();
    });
  });

  describe('4. GET /api/interests/received (Business Received Interests)', () => {
    it('should return interests received by the authenticated founder\'s business only', async () => {
      // Alice interested in Carol
      mockInterests.push({
        _id: '65f01234567890abcdef8001',
        investor: investor1._id,
        business: businessCarol._id,
        message: 'Alice interested in Carol',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Bob interested in Dave
      mockInterests.push({
        _id: '65f01234567890abcdef8002',
        investor: investor2._id,
        business: businessDave._id,
        message: 'Bob interested in Dave',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const resCarol = await request(app)
        .get('/api/interests/received')
        .set('Authorization', `Bearer ${tokenFounder1}`);

      expect(resCarol.status).toBe(200);
      expect(resCarol.body.count).toBe(1);
      expect(resCarol.body.data[0].message).toBe('Alice interested in Carol');
      expect(resCarol.body.data[0].investor.name).toBe(investor1.name);

      const resDave = await request(app)
        .get('/api/interests/received')
        .set('Authorization', `Bearer ${tokenFounder2}`);

      expect(resDave.status).toBe(200);
      expect(resDave.body.count).toBe(1);
      expect(resDave.body.data[0].message).toBe('Bob interested in Dave');
    });

    it('should never expose investor password hashes in received interests', async () => {
      mockInterests.push({
        _id: '65f01234567890abcdef8001',
        investor: investor1._id,
        business: businessCarol._id,
        message: 'Alice interest',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await request(app)
        .get('/api/interests/received')
        .set('Authorization', `Bearer ${tokenFounder1}`);

      expect(res.status).toBe(200);
      const item = res.body.data[0];
      expect(item.investor.password).toBeUndefined();
    });

    it('should return empty list cleanly if founder has no business profile yet', async () => {
      const res = await request(app)
        .get('/api/interests/received')
        .set('Authorization', `Bearer ${tokenFounderWithoutBusiness}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('5. PATCH /api/interests/:id/status (Accept or Decline Interest)', () => {
    let interestCarol;

    beforeEach(() => {
      interestCarol = {
        _id: '65f01234567890abcdef8010',
        investor: investor1._id,
        business: businessCarol._id,
        message: 'Seed round discussion',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockInterests = [interestCarol];
    });

    it('should allow business owner to accept a pending interest', async () => {
      const res = await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('accepted');
    });

    it('should allow business owner to decline a pending interest', async () => {
      const res = await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'declined' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('declined');
    });

    it('should reject invalid status with HTTP 400', async () => {
      const res = await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'negotiating' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject resetting terminal status to pending with HTTP 400', async () => {
      const res = await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'pending' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 404 if a different business owner attempts to update the interest', async () => {
      const res = await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder2}`) // Dave trying to modify Carol's interest
        .send({ status: 'accepted' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should return HTTP 404 if interest does not exist', async () => {
      const res = await request(app)
        .patch('/api/interests/65f01234567890abcdef9999/status')
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return HTTP 409 Conflict if trying to change an accepted interest to declined', async () => {
      // First accept
      await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'accepted' });

      // Then try to decline
      const res = await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'declined' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already been accepted/i);
    });

    it('should return HTTP 409 Conflict if trying to change a declined interest to accepted', async () => {
      // First decline
      await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'declined' });

      // Then try to accept
      const res = await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already been declined/i);
    });

    it('should protect against conflicting concurrent status updates using atomic conditional check', async () => {
      // First update transitions pending -> accepted
      const res1 = await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'accepted' });

      expect(res1.status).toBe(200);

      // Second concurrent update finds no pending status document and returns 409
      const res2 = await request(app)
        .patch(`/api/interests/${interestCarol._id}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'declined' });

      expect(res2.status).toBe(409);
      expect(res2.body.success).toBe(false);
    });
  });

  describe('6. End-to-End Privacy Integration (Accepted Interest unlocks private pitch link in Stage 5 API)', () => {
    it('should grant accepted investor access to privatePitchLink and contactEmail via GET /api/businesses/:id', async () => {
      // Initially, investor has no accepted interest in Carol's business
      const preRes = await request(app)
        .get(`/api/businesses/${businessCarol._id}`)
        .set('Authorization', `Bearer ${tokenInvestor1}`);

      expect(preRes.status).toBe(200);
      expect(preRes.body.business.privatePitchLink).toBeUndefined();
      expect(preRes.body.business.contactEmail).toBeUndefined();

      // Submit interest
      const interestRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenInvestor1}`)
        .send({
          businessId: businessCarol._id,
          message: 'Interested in participating in this round.'
        });
      expect(interestRes.status).toBe(201);
      const interestId = interestRes.body.data.id;

      // Founder accepts interest
      const acceptRes = await request(app)
        .patch(`/api/interests/${interestId}/status`)
        .set('Authorization', `Bearer ${tokenFounder1}`)
        .send({ status: 'accepted' });
      expect(acceptRes.status).toBe(200);

      // Now query business detail again as the accepted investor
      const postRes = await request(app)
        .get(`/api/businesses/${businessCarol._id}`)
        .set('Authorization', `Bearer ${tokenInvestor1}`);

      expect(postRes.status).toBe(200);
      expect(postRes.body.business.privatePitchLink).toBe(businessCarol.privatePitchLink);
      expect(postRes.body.business.contactEmail).toBe(businessCarol.contactEmail);
    });
  });
});
