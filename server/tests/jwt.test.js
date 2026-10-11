const jwt = require('jsonwebtoken');
const { signToken, verifyToken } = require('../src/utils/jwt');

describe('JWT Utility (server/src/utils/jwt.js)', () => {
  const originalSecret = process.env.JWT_SECRET;
  const testSecret = 'test_jwt_secret_key_1234567890_antigravity';

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('should sign a token with userId in sub claim', () => {
    const token = signToken({ userId: '65f01234567890abcdef1234', role: 'business' });
    expect(typeof token).toBe('string');

    const decoded = jwt.decode(token);
    expect(decoded).toHaveProperty('sub', '65f01234567890abcdef1234');
    expect(decoded).toHaveProperty('role', 'business');
    expect(decoded).toHaveProperty('exp');
  });

  it('should verify and return payload for a valid token', () => {
    const token = signToken({ userId: '65f01234567890abcdef1234', role: 'investor' });
    const verified = verifyToken(token);

    expect(verified.sub).toBe('65f01234567890abcdef1234');
    expect(verified.role).toBe('investor');
  });

  it('should throw when token is invalid or corrupted', () => {
    expect(() => {
      verifyToken('invalid.jwt.token');
    }).toThrow();
  });

  it('should throw an error if JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;

    expect(() => {
      signToken({ userId: '123' });
    }).toThrow(/JWT_SECRET/);

    process.env.JWT_SECRET = testSecret;
  });
});
