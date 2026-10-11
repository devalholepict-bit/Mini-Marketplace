const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const User = require('../src/models/User');
const { signToken } = require('../src/utils/jwt');

describe('Auth Endpoints & Password Protection (Supertest Integration)', () => {
  const originalSecret = process.env.JWT_SECRET;
  const testSecret = 'integration_test_jwt_secret_key_antigravity';

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      name: 'Demo Founder',
      email: 'founder@example.com',
      password: 'SecurePassword123!',
      role: 'business'
    };

    it('should successfully register a new user and return HTTP 201 with token and sanitized user', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      const fakeCreatedUser = {
        _id: '65f01234567890abcdef1001',
        name: 'Demo Founder',
        email: 'founder@example.com',
        role: 'business',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        toSafeObject() {
          return {
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
          };
        }
      };

      jest.spyOn(User, 'create').mockResolvedValue(fakeCreatedUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'founder@example.com');
      expect(response.body.user).toHaveProperty('role', 'business');

      // Crucial: ensure password or password hash is NEVER present in response
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('SecurePassword123!');
    });

    it('should return HTTP 409 if email is already registered', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'existing_id', email: 'founder@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/already registered/i);
    });

    it('should return HTTP 400 when input validation fails (e.g. short password or invalid role)', async () => {
      const invalidData = {
        name: 'A', // too short (< 2)
        email: 'not-an-email',
        password: 'short', // < 8
        role: 'admin' // not in ['business', 'investor']
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('Password Hashing Verification on User Model', () => {
    it('should hash the password with bcrypt in pre-save hook and not store plaintext', async () => {
      const plaintext = 'PlainPasswordToHash123!';
      const user = new User({
        name: 'Hash Test User',
        email: 'hash@example.com',
        password: plaintext,
        role: 'investor'
      });

      // Verify that user instance contains plaintext initially before save
      expect(user.password).toBe(plaintext);

      // Simulate saving to trigger Mongoose pre('save') middleware
      await new Promise((resolve, reject) => {
        // Trigger pre-save hooks
        user.schema.s.hooks.execPre('save', user, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // After pre-save, password must be transformed into a bcrypt hash
      expect(user.password).not.toBe(plaintext);
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/);

      // Verify with bcrypt.compare
      const isMatch = await bcrypt.compare(plaintext, user.password);
      expect(isMatch).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return HTTP 200 with token and sanitized user on valid credentials', async () => {
      const plaintextPassword = 'ValidPassword123!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plaintextPassword, salt);

      const mockDbUser = {
        _id: '65f01234567890abcdef2002',
        name: 'Login User',
        email: 'login@example.com',
        password: hashedPassword,
        role: 'investor',
        comparePassword: async (candidate) => bcrypt.compare(candidate, hashedPassword),
        toSafeObject() {
          return {
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role
          };
        }
      };

      const queryMock = {
        select: jest.fn().mockResolvedValue(mockDbUser)
      };
      jest.spyOn(User, 'findOne').mockReturnValue(queryMock);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: plaintextPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return HTTP 401 when email does not exist', async () => {
      const queryMock = {
        select: jest.fn().mockResolvedValue(null)
      };
      jest.spyOn(User, 'findOne').mockReturnValue(queryMock);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'SomePassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/Invalid email or password/i);
    });

    it('should return HTTP 401 when password is wrong', async () => {
      const mockDbUser = {
        _id: '65f01234567890abcdef2002',
        email: 'login@example.com',
        password: 'hashed_value',
        comparePassword: async () => false
      };

      const queryMock = {
        select: jest.fn().mockResolvedValue(mockDbUser)
      };
      jest.spyOn(User, 'findOne').mockReturnValue(queryMock);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Invalid email or password/i);
    });

    it('should return HTTP 400 when login payload is malformed', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Missing or malformed/i);
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(response.status).toBe(401);
    });

    it('should return HTTP 200 with sanitized user profile when token is valid', async () => {
      const mockUser = {
        _id: '65f01234567890abcdef3003',
        name: 'Alice Founder',
        email: 'alice@example.com',
        role: 'business',
        createdAt: new Date().toISOString(),
        toSafeObject() {
          return {
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt
          };
        }
      };

      const validToken = signToken({ userId: mockUser._id, role: mockUser.role });
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toHaveProperty('id', mockUser._id);
      expect(response.body.user).toHaveProperty('email', 'alice@example.com');
      expect(response.body.user).toHaveProperty('role', 'business');
      expect(response.body.user.password).toBeUndefined();
    });
  });
});
