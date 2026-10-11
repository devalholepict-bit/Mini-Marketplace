const {
  seedDatabase,
  validateSeedEnvironment,
  getDemoDataDefinitions
} = require('../src/seed/seed');
const User = require('../src/models/User');
const Business = require('../src/models/Business');
const Interest = require('../src/models/Interest');

describe('Seed Script Safety & Idempotency (Stage 7)', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSeedPassword = process.env.SEED_DEMO_PASSWORD;
  const testPassword = 'Test_Demo_Password_2026!';

  let mockUsers = [];
  let mockBusinesses = [];
  let mockInterests = [];

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.SEED_DEMO_PASSWORD = testPassword;

    mockUsers = [];
    mockBusinesses = [];
    mockInterests = [];

    // Mock User.findOne
    jest.spyOn(User, 'findOne').mockImplementation(async (query) => {
      const found = mockUsers.find((u) => u.email === query.email);
      return found ? { ...found } : null;
    });

    // Mock User.create
    jest.spyOn(User, 'create').mockImplementation(async (userData) => {
      const newUser = {
        _id: '65f01234567890abcdef100' + (mockUsers.length + 1),
        ...userData,
        savedBusinesses: []
      };
      mockUsers.push(newUser);
      return newUser;
    });

    // Mock User.findByIdAndUpdate
    jest.spyOn(User, 'findByIdAndUpdate').mockImplementation(async (id, update) => {
      const user = mockUsers.find((u) => String(u._id) === String(id));
      if (!user) return null;

      if (update.$addToSet && update.$addToSet.savedBusinesses) {
        const item = String(update.$addToSet.savedBusinesses);
        if (!user.savedBusinesses.map(String).includes(item)) {
          user.savedBusinesses.push(update.$addToSet.savedBusinesses);
        }
      }
      return user;
    });

    // Mock Business.findOne
    jest.spyOn(Business, 'findOne').mockImplementation(async (query) => {
      const found = mockBusinesses.find((b) => String(b.owner) === String(query.owner));
      return found ? { ...found } : null;
    });

    // Mock Business.create
    jest.spyOn(Business, 'create').mockImplementation(async (bizData) => {
      const newBiz = {
        _id: '65f01234567890abcdef000' + (mockBusinesses.length + 1),
        ...bizData
      };
      mockBusinesses.push(newBiz);
      return newBiz;
    });

    // Mock Interest.findOne
    jest.spyOn(Interest, 'findOne').mockImplementation(async (query) => {
      const found = mockInterests.find(
        (i) =>
          String(i.investor) === String(query.investor) &&
          String(i.business) === String(query.business)
      );
      return found ? { ...found } : null;
    });

    // Mock Interest.create
    jest.spyOn(Interest, 'create').mockImplementation(async (intData) => {
      const newInt = {
        _id: '65f01234567890abcdef800' + (mockInterests.length + 1),
        ...intData
      };
      mockInterests.push(newInt);
      return newInt;
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.SEED_DEMO_PASSWORD = originalSeedPassword;
    jest.restoreAllMocks();
  });

  describe('1. Environment Safety Validation', () => {
    it('should throw a clear error when SEED_DEMO_PASSWORD is not provided', () => {
      delete process.env.SEED_DEMO_PASSWORD;

      expect(() => {
        validateSeedEnvironment();
      }).toThrow(/SEED_DEMO_PASSWORD environment variable is required/i);
    });

    it('should throw an error when SEED_DEMO_PASSWORD is empty or whitespace', () => {
      process.env.SEED_DEMO_PASSWORD = '   ';

      expect(() => {
        validateSeedEnvironment();
      }).toThrow(/SEED_DEMO_PASSWORD environment variable is required/i);
    });

    it('should strictly block seeding when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';

      expect(() => {
        validateSeedEnvironment();
      }).toThrow(/strictly forbidden in production/i);
    });

    it('should return trimmed seed password in valid non-production environment', () => {
      process.env.SEED_DEMO_PASSWORD = '  my_valid_secret  ';

      const password = validateSeedEnvironment();
      expect(password).toBe('my_valid_secret');
    });
  });

  describe('2. Idempotency & Data Preservation', () => {
    it('should create all demo records on the initial run', async () => {
      const summary = await seedDatabase({ skipDbConnection: true });

      expect(summary.usersCreated).toBe(4);
      expect(summary.businessesCreated).toBe(2);
      expect(summary.interestsCreated).toBe(3);
      expect(summary.savedUpdated).toBe(2);

      expect(mockUsers.length).toBe(4);
      expect(mockBusinesses.length).toBe(2);
      expect(mockInterests.length).toBe(3);
    });

    it('should preserve existing records and not create duplicates on second run', async () => {
      // First run: creates initial records
      const summary1 = await seedDatabase({ skipDbConnection: true });
      expect(summary1.usersCreated).toBe(4);
      expect(summary1.businessesCreated).toBe(2);
      expect(summary1.interestsCreated).toBe(3);

      // Second run: should preserve everything
      const summary2 = await seedDatabase({ skipDbConnection: true });
      expect(summary2.usersCreated).toBe(0);
      expect(summary2.usersPreserved).toBe(4);
      expect(summary2.businessesCreated).toBe(0);
      expect(summary2.businessesPreserved).toBe(2);
      expect(summary2.interestsCreated).toBe(0);
      expect(summary2.interestsPreserved).toBe(3);

      // Total count remains unchanged
      expect(mockUsers.length).toBe(4);
      expect(mockBusinesses.length).toBe(2);
      expect(mockInterests.length).toBe(3);
    });

    it('should fail safely if an existing demo account has an unexpected role', async () => {
      // Pre-insert an account with an unexpected role
      mockUsers.push({
        _id: '65f01234567890abcdef9999',
        name: 'Attacker or Corrupted Account',
        email: 'demo.investor@meulink.dev',
        role: 'business', // unexpected role for demo.investor
        savedBusinesses: []
      });

      await expect(seedDatabase({ skipDbConnection: true })).rejects.toThrow(
        /unexpected role 'business' instead of 'investor'/i
      );
    });
  });

  describe('3. Demo Data Quality', () => {
    it('should include demo accounts for both investor and business roles', () => {
      const { users, businesses, interests } = getDemoDataDefinitions(testPassword);

      const investors = users.filter((u) => u.role === 'investor');
      const founders = users.filter((u) => u.role === 'business');

      expect(investors.length).toBeGreaterThanOrEqual(1);
      expect(founders.length).toBeGreaterThanOrEqual(2);
      expect(businesses.length).toBeGreaterThanOrEqual(2);
      expect(interests.length).toBeGreaterThanOrEqual(3);

      // Statuses must cover pending, accepted, and declined
      const statuses = interests.map((i) => i.status);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('accepted');
      expect(statuses).toContain('declined');
    });
  });
});
