const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Business = require('../src/models/Business');
const Interest = require('../src/models/Interest');
const { signToken } = require('../src/utils/jwt');

describe('Business Discovery, Search, Filters & Detail (Stage 5 Integration)', () => {
  const originalSecret = process.env.JWT_SECRET;
  const testSecret = 'discovery_test_jwt_secret_antigravity';

  const founderUser = {
    _id: '65f01234567890abcdef1001',
    name: 'Founder Alice',
    email: 'alice@example.com',
    role: 'business'
  };

  const otherFounderUser = {
    _id: '65f01234567890abcdef1002',
    name: 'Founder Bob',
    email: 'bob@example.com',
    role: 'business'
  };

  const investorAccepted = {
    _id: '65f01234567890abcdef2001',
    name: 'Investor Accepted',
    email: 'accepted@investor.com',
    role: 'investor'
  };

  const investorPending = {
    _id: '65f01234567890abcdef2002',
    name: 'Investor Pending',
    email: 'pending@investor.com',
    role: 'investor'
  };

  const investorDeclined = {
    _id: '65f01234567890abcdef2003',
    name: 'Investor Declined',
    email: 'declined@investor.com',
    role: 'investor'
  };

  let tokenFounder;
  let tokenInvestorAccepted;
  let tokenInvestorPending;
  let tokenInvestorDeclined;

  // Mock catalog of businesses
  let mockBusinesses = [];
  let mockInterests = [];

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
    tokenFounder = signToken({ userId: founderUser._id, role: founderUser.role });
    tokenInvestorAccepted = signToken({
      userId: investorAccepted._id,
      role: investorAccepted.role
    });
    tokenInvestorPending = signToken({
      userId: investorPending._id,
      role: investorPending.role
    });
    tokenInvestorDeclined = signToken({
      userId: investorDeclined._id,
      role: investorDeclined.role
    });
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  beforeEach(() => {
    mockBusinesses = [
      {
        _id: '65f01234567890abcdef0001',
        owner: founderUser._id,
        name: 'EcoEnergy Labs',
        tagline: 'Solar and flow-battery storage solutions',
        description: 'Next generation commercial clean energy storage systems for urban power grids.',
        industry: 'CleanTech',
        country: 'Portugal',
        city: 'Lisbon',
        stage: 'Seed',
        revenueRange: '€50k - €200k ARR',
        fundingGoal: 500000,
        purpose: 'R&D and pilots',
        isPublished: true,
        privatePitchLink: 'https://dataroom.example.com/ecoenergy',
        contactEmail: 'alice@ecoenergy.pt',
        createdAt: new Date('2026-01-10T10:00:00Z')
      },
      {
        _id: '65f01234567890abcdef0002',
        owner: otherFounderUser._id,
        name: 'PayStream Systems',
        tagline: 'B2B cross-border instant settlement network',
        description: 'Instant settlement rails connecting emerging market exporters with European buyers.',
        industry: 'FinTech',
        country: 'India',
        city: 'Mumbai',
        stage: 'Series A',
        revenueRange: '€1M - €5M ARR',
        fundingGoal: 1500000,
        purpose: 'Regulatory licensing',
        isPublished: true,
        privatePitchLink: 'https://dataroom.example.com/paystream',
        contactEmail: 'bob@paystream.in',
        createdAt: new Date('2026-02-15T10:00:00Z')
      },
      {
        _id: '65f01234567890abcdef0003',
        owner: '65f01234567890abcdef1003',
        name: 'GreenGrid Solar',
        tagline: 'IoT microgrid management for agricultural operations',
        description: 'Smart IoT inverters that optimize irrigation based on solar generation curves.',
        industry: 'CleanTech',
        country: 'India',
        city: 'Bengaluru',
        stage: 'Pre-Seed',
        revenueRange: 'Pre-revenue',
        fundingGoal: 200000,
        purpose: 'Field trials',
        isPublished: true,
        privatePitchLink: 'https://dataroom.example.com/greengrid',
        contactEmail: 'contact@greengrid.in',
        createdAt: new Date('2026-03-01T10:00:00Z')
      },
      {
        _id: '65f01234567890abcdef0004',
        owner: '65f01234567890abcdef1004',
        name: 'AgriSense Moisture',
        tagline: 'Deep soil capacitance sensors for vineyards',
        description: 'Affordable LoRaWAN wireless sensor probes conserving up to 40% irrigation water.',
        industry: 'AgriTech',
        country: 'Portugal',
        city: 'Porto',
        stage: 'Seed',
        revenueRange: '€200k - €500k ARR',
        fundingGoal: 350000,
        purpose: 'Manufacturing molds',
        isPublished: true,
        privatePitchLink: 'https://dataroom.example.com/agrisense',
        contactEmail: 'hello@agrisense.pt',
        createdAt: new Date('2026-03-20T10:00:00Z')
      },
      {
        _id: '65f01234567890abcdef0005',
        owner: '65f01234567890abcdef1005',
        name: 'BioHealth Analytics (Unpublished Draft)',
        tagline: 'Private oncology biomarker diagnostics',
        description: 'Confidential clinical laboratory software under active patent application.',
        industry: 'HealthTech',
        country: 'Brazil',
        city: 'Sao Paulo',
        stage: 'Seed',
        revenueRange: 'Pre-revenue',
        fundingGoal: 800000,
        purpose: 'Clinical trials',
        isPublished: false, // UNPUBLISHED!
        privatePitchLink: 'https://dataroom.example.com/biohealth',
        contactEmail: 'secret@biohealth.br',
        createdAt: new Date('2026-04-01T10:00:00Z')
      }
    ];

    mockInterests = [
      {
        _id: '65f01234567890abcdef8001',
        investor: investorAccepted._id,
        business: '65f01234567890abcdef0001', // EcoEnergy Labs
        status: 'accepted'
      },
      {
        _id: '65f01234567890abcdef8002',
        investor: investorPending._id,
        business: '65f01234567890abcdef0001', // EcoEnergy Labs
        status: 'pending'
      },
      {
        _id: '65f01234567890abcdef8003',
        investor: investorDeclined._id,
        business: '65f01234567890abcdef0001', // EcoEnergy Labs
        status: 'declined'
      }
    ];

    // Mock User.findById for authenticate middleware
    jest.spyOn(User, 'findById').mockImplementation(async (id) => {
      const idStr = String(id);
      if (idStr === String(founderUser._id)) return founderUser;
      if (idStr === String(otherFounderUser._id)) return otherFounderUser;
      if (idStr === String(investorAccepted._id)) return investorAccepted;
      if (idStr === String(investorPending._id)) return investorPending;
      if (idStr === String(investorDeclined._id)) return investorDeclined;
      return null;
    });

    // Helper to evaluate in-memory filter matching MongoDB filter structure
    const matchFilter = (item, filter) => {
      if (filter.isPublished !== undefined && item.isPublished !== filter.isPublished) {
        return false;
      }
      if (filter.industry && item.industry !== filter.industry) {
        return false;
      }
      if (filter.stage && item.stage !== filter.stage) {
        return false;
      }
      if (filter.country && item.country !== filter.country) {
        return false;
      }
      if (filter.fundingGoal) {
        if (filter.fundingGoal.$gte !== undefined && item.fundingGoal < filter.fundingGoal.$gte) {
          return false;
        }
        if (filter.fundingGoal.$lte !== undefined && item.fundingGoal > filter.fundingGoal.$lte) {
          return false;
        }
      }
      if (filter.$or) {
        const matchesAny = filter.$or.some((condition) => {
          if (condition.name && condition.name.test(item.name)) return true;
          if (condition.tagline && condition.tagline.test(item.tagline)) return true;
          if (condition.description && condition.description.test(item.description)) return true;
          return false;
        });
        if (!matchesAny) return false;
      }
      return true;
    };

    // Mock Business.countDocuments
    jest.spyOn(Business, 'countDocuments').mockImplementation(async (filter) => {
      return mockBusinesses.filter((b) => matchFilter(b, filter)).length;
    });

    // Mock Business.find
    jest.spyOn(Business, 'find').mockImplementation((filter) => {
      let filtered = mockBusinesses.filter((b) => matchFilter(b, filter));

      const queryObj = {
        sort: (sortObj) => {
          const [sortField, sortDir] = Object.entries(sortObj)[0];
          filtered.sort((a, b) => {
            if (a[sortField] < b[sortField]) return sortDir === 1 ? -1 : 1;
            if (a[sortField] > b[sortField]) return sortDir === 1 ? 1 : -1;
            // tie-breaker
            return String(a._id).localeCompare(String(b._id));
          });
          return queryObj;
        },
        skip: (num) => {
          filtered = filtered.slice(num);
          return queryObj;
        },
        limit: (num) => {
          filtered = filtered.slice(0, num);
          return Promise.resolve(filtered);
        }
      };

      return queryObj;
    });

    // Mock Business.findById
    jest.spyOn(Business, 'findById').mockImplementation(async (id) => {
      const found = mockBusinesses.find((b) => String(b._id) === String(id));
      return found || null;
    });

    // Mock Interest.findOne
    jest.spyOn(Interest, 'findOne').mockImplementation(async (query) => {
      return (
        mockInterests.find(
          (i) =>
            String(i.investor) === String(query.investor) &&
            String(i.business) === String(query.business) &&
            i.status === query.status
        ) || null
      );
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Access Control on GET /api/businesses', () => {
    it('should return HTTP 401 when request is unauthenticated', async () => {
      const res = await request(app).get('/api/businesses');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });

    it('should return HTTP 403 when a business-role user attempts to list marketplace businesses', async () => {
      const res = await request(app)
        .get('/api/businesses')
        .set('Authorization', `Bearer ${tokenFounder}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should succeed with HTTP 200 for authenticated investor role', async () => {
      const res = await request(app)
        .get('/api/businesses')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('2. Publication Filtering & Private Fields Protection in Listing', () => {
    it('should strictly return published businesses only (never unpublished drafts)', async () => {
      const res = await request(app)
        .get('/api/businesses')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      // Catalog has 4 published and 1 unpublished
      expect(res.body.pagination.total).toBe(4);
      const names = res.body.data.map((b) => b.name);
      expect(names).not.toContain('BioHealth Analytics (Unpublished Draft)');
    });

    it('should NEVER include private fields (privatePitchLink, contactEmail) in marketplace listing responses', async () => {
      const res = await request(app)
        .get('/api/businesses')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((b) => {
        expect(b.privatePitchLink).toBeUndefined();
        expect(b.contactEmail).toBeUndefined();
      });

      const responseString = JSON.stringify(res.body);
      expect(responseString).not.toContain('alice@ecoenergy.pt');
      expect(responseString).not.toContain('https://dataroom.example.com');
    });
  });

  describe('3. Filtering Capabilities', () => {
    it('should filter by industry correctly', async () => {
      const res = await request(app)
        .get('/api/businesses?industry=CleanTech')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      res.body.data.forEach((b) => {
        expect(b.industry).toBe('CleanTech');
      });
    });

    it('should filter by stage correctly', async () => {
      const res = await request(app)
        .get('/api/businesses?stage=Series%20A')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('PayStream Systems');
    });

    it('should filter by country correctly', async () => {
      const res = await request(app)
        .get('/api/businesses?country=Portugal')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      res.body.data.forEach((b) => {
        expect(b.country).toBe('Portugal');
      });
    });

    it('should filter by combined filters (country=India AND industry=CleanTech)', async () => {
      const res = await request(app)
        .get('/api/businesses?country=India&industry=CleanTech')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('GreenGrid Solar');
    });

    it('should filter by funding range (minFunding and maxFunding)', async () => {
      const res = await request(app)
        .get('/api/businesses?minFunding=300000&maxFunding=600000')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2); // 350k (AgriSense) and 500k (EcoEnergy)
      res.body.data.forEach((b) => {
        expect(b.fundingGoal).toBeGreaterThanOrEqual(300000);
        expect(b.fundingGoal).toBeLessThanOrEqual(600000);
      });
    });

    it('should reject when minFunding is greater than maxFunding with HTTP 400', async () => {
      const res = await request(app)
        .get('/api/businesses?minFunding=500000&maxFunding=100000')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/validation failed/i);
    });
  });

  describe('4. Search and Regex Safety', () => {
    it('should find matching businesses by search query q in name and tagline', async () => {
      const res = await request(app)
        .get('/api/businesses?q=microgrid')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('GreenGrid Solar');
    });

    it('should safely handle search text with special regex characters without error', async () => {
      const res = await request(app)
        .get('/api/businesses?q=([.*+?^${}()|])')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0); // Safely escaped, no matches
    });
  });

  describe('5. Pagination and Sorting', () => {
    it('should paginate correctly with custom page and limit', async () => {
      const res = await request(app)
        .get('/api/businesses?page=1&limit=2')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 4,
        totalPages: 2
      });
    });

    it('should support sorting by fundingGoal ascending', async () => {
      const res = await request(app)
        .get('/api/businesses?sortBy=fundingGoal&order=asc')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].fundingGoal).toBe(200000); // GreenGrid
      expect(res.body.data[res.body.data.length - 1].fundingGoal).toBe(1500000); // PayStream
    });

    it('should reject invalid pagination or sort parameter with HTTP 400', async () => {
      const resInvalidSort = await request(app)
        .get('/api/businesses?sortBy=invalidField')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);
      expect(resInvalidSort.status).toBe(400);

      const resInvalidLimit = await request(app)
        .get('/api/businesses?limit=999') // max is 50
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);
      expect(resInvalidLimit.status).toBe(400);
    });
  });

  describe('6. Business Detail Endpoint (GET /api/businesses/:id)', () => {
    it('should return HTTP 400 when business ID format is invalid', async () => {
      const res = await request(app)
        .get('/api/businesses/not-a-valid-object-id')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid request parameters/i);
    });

    it('should return HTTP 404 when business does not exist', async () => {
      const res = await request(app)
        .get('/api/businesses/65f01234567890abcdef9999')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should return HTTP 404 to an unrelated investor when the business is unpublished', async () => {
      // 0005 is BioHealth (unpublished)
      const res = await request(app)
        .get('/api/businesses/65f01234567890abcdef0005')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should expose private fields (privatePitchLink, contactEmail) to the business owner', async () => {
      // Founder Alice queries her own business (0001)
      const res = await request(app)
        .get('/api/businesses/65f01234567890abcdef0001')
        .set('Authorization', `Bearer ${tokenFounder}`);

      expect(res.status).toBe(200);
      expect(res.body.business).toHaveProperty('privatePitchLink', 'https://dataroom.example.com/ecoenergy');
      expect(res.body.business).toHaveProperty('contactEmail', 'alice@ecoenergy.pt');
    });

    it('should expose private fields to an investor whose Interest is accepted', async () => {
      // investorAccepted has accepted interest for 0001
      const res = await request(app)
        .get('/api/businesses/65f01234567890abcdef0001')
        .set('Authorization', `Bearer ${tokenInvestorAccepted}`);

      expect(res.status).toBe(200);
      expect(res.body.business).toHaveProperty('privatePitchLink', 'https://dataroom.example.com/ecoenergy');
      expect(res.body.business).toHaveProperty('contactEmail', 'alice@ecoenergy.pt');
    });

    it('should HIDE private fields from an investor whose Interest is pending', async () => {
      // investorPending has pending interest for 0001
      const res = await request(app)
        .get('/api/businesses/65f01234567890abcdef0001')
        .set('Authorization', `Bearer ${tokenInvestorPending}`);

      expect(res.status).toBe(200);
      expect(res.body.business.name).toBe('EcoEnergy Labs');
      expect(res.body.business.privatePitchLink).toBeUndefined();
      expect(res.body.business.contactEmail).toBeUndefined();
    });

    it('should HIDE private fields from an investor whose Interest is declined', async () => {
      // investorDeclined has declined interest for 0001
      const res = await request(app)
        .get('/api/businesses/65f01234567890abcdef0001')
        .set('Authorization', `Bearer ${tokenInvestorDeclined}`);

      expect(res.status).toBe(200);
      expect(res.body.business.name).toBe('EcoEnergy Labs');
      expect(res.body.business.privatePitchLink).toBeUndefined();
      expect(res.body.business.contactEmail).toBeUndefined();
    });
  });
});
