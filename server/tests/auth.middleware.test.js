const { authenticate } = require('../src/middleware/auth.middleware');
const { authorize } = require('../src/middleware/authorize.middleware');
const User = require('../src/models/User');
const { signToken } = require('../src/utils/jwt');

describe('Auth & Authorize Middleware Tests', () => {
  const originalSecret = process.env.JWT_SECRET;
  const testSecret = 'test_jwt_secret_middleware_antigravity';

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should return HTTP 401 when Authorization header is missing', async () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Missing or malformed/)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return HTTP 401 when Authorization header does not start with Bearer', async () => {
      const req = { headers: { authorization: 'Basic 12345' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return HTTP 401 when token is invalid or expired', async () => {
      const req = { headers: { authorization: 'Bearer invalid.token.signature' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Invalid or expired token/)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return HTTP 401 when token identifies a user who no longer exists', async () => {
      const token = signToken({ userId: '65f01234567890abcdef1234', role: 'business' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      jest.spyOn(User, 'findById').mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/no longer exists/)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach user to req.user and call next() for a valid token', async () => {
      const mockUser = {
        _id: '65f01234567890abcdef1234',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'business'
      };
      const token = signToken({ userId: mockUser._id, role: mockUser.role });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      await authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should return HTTP 401 when req.user is missing', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = authorize('business');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return HTTP 403 when user lacks the required role', () => {
      const req = { user: { role: 'investor' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = authorize('business');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Forbidden/)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when user has the required single role', () => {
      const req = { user: { role: 'business' } };
      const res = {};
      const next = jest.fn();

      const middleware = authorize('business');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next() when user role matches one of multiple allowed roles', () => {
      const req = { user: { role: 'investor' } };
      const res = {};
      const next = jest.fn();

      const middleware = authorize('business', 'investor');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
