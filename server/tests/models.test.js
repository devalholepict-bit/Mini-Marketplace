const mongoose = require('mongoose');
const User = require('../src/models/User');
const Business = require('../src/models/Business');
const Interest = require('../src/models/Interest');

describe('Mongoose Models Schema Verification (Unit / Schema Tests)', () => {
  describe('User Model Schema', () => {
    it('should define required fields: name, email, password, and role', () => {
      const emailPath = User.schema.path('email');
      const namePath = User.schema.path('name');
      const passwordPath = User.schema.path('password');
      const rolePath = User.schema.path('role');

      expect(namePath.isRequired).toBe(true);
      expect(emailPath.isRequired).toBe(true);
      expect(passwordPath.isRequired).toBe(true);
      expect(rolePath.isRequired).toBe(true);
    });

    it('should declare unique constraint on email', () => {
      const emailPath = User.schema.path('email');
      expect(emailPath.options.unique).toBe(true);
    });

    it('should exclude password by default using select: false', () => {
      const passwordPath = User.schema.path('password');
      expect(passwordPath.options.select).toBe(false);
    });

    it('should enforce role enum values to business and investor', () => {
      const rolePath = User.schema.path('role');
      expect(rolePath.enumValues).toEqual(['business', 'investor']);
    });

    it('should define savedBusinesses as an array of Business ObjectId references defaulting to empty array', () => {
      const savedPath = User.schema.path('savedBusinesses');
      expect(savedPath).toBeDefined();
      expect(savedPath.caster.options.ref).toBe('Business');
      expect(savedPath.options.default).toEqual([]);
    });
  });

  describe('Business Model Schema', () => {
    it('should declare owner as a required User reference with unique constraint', () => {
      const ownerPath = Business.schema.path('owner');
      expect(ownerPath.isRequired).toBe(true);
      expect(ownerPath.options.ref).toBe('User');
      expect(ownerPath.options.unique).toBe(true);
    });

    it('should require core company profile fields', () => {
      const requiredFields = [
        'name',
        'tagline',
        'description',
        'industry',
        'country',
        'city',
        'stage',
        'revenueRange',
        'fundingGoal',
        'purpose',
        'contactEmail'
      ];

      requiredFields.forEach((field) => {
        const path = Business.schema.path(field);
        expect(path).toBeDefined();
        expect(path.isRequired).toBe(true);
      });
    });

    it('should require fundingGoal to be a positive number', () => {
      const fundingGoalPath = Business.schema.path('fundingGoal');
      expect(fundingGoalPath.options.min).toBeDefined();
      const minValue = Array.isArray(fundingGoalPath.options.min)
        ? fundingGoalPath.options.min[0]
        : fundingGoalPath.options.min;
      expect(minValue).toBeGreaterThanOrEqual(1);
    });

    it('should default isPublished to false and privatePitchLink to empty string', () => {
      const isPublishedPath = Business.schema.path('isPublished');
      const pitchLinkPath = Business.schema.path('privatePitchLink');

      expect(isPublishedPath.options.default).toBe(false);
      expect(pitchLinkPath.options.default).toBe('');
    });
  });

  describe('Interest Model Schema', () => {
    it('should define investor and business references with required status and message', () => {
      const investorPath = Interest.schema.path('investor');
      const businessPath = Interest.schema.path('business');
      const messagePath = Interest.schema.path('message');
      const statusPath = Interest.schema.path('status');

      expect(investorPath.options.ref).toBe('User');
      expect(investorPath.isRequired).toBe(true);

      expect(businessPath.options.ref).toBe('Business');
      expect(businessPath.isRequired).toBe(true);

      expect(messagePath.isRequired).toBe(true);
      expect(statusPath.enumValues).toEqual(['pending', 'accepted', 'declined']);
      expect(statusPath.options.default).toBe('pending');
    });

    it('should declare a compound unique index on { investor: 1, business: 1 }', () => {
      const indexes = Interest.schema.indexes();
      const compoundUnique = indexes.find(
        ([fields, options]) =>
          fields.investor === 1 && fields.business === 1 && options && options.unique === true
      );

      expect(compoundUnique).toBeDefined();
    });

    it('should declare query indexes for investor lookups and business/status filtering', () => {
      const indexes = Interest.schema.indexes();

      const investorIndex = indexes.find(([fields]) => fields.investor === 1 && !fields.business);
      expect(investorIndex).toBeDefined();

      const businessStatusIndex = indexes.find(
        ([fields]) => fields.business === 1 && fields.status === 1
      );
      expect(businessStatusIndex).toBeDefined();
    });
  });

  describe('Database Connection Error Handling in connectDB', () => {
    it('should throw an informative error when MONGODB_URI is not provided', async () => {
      const connectDB = require('../src/config/db');
      const originalUri = process.env.MONGODB_URI;

      delete process.env.MONGODB_URI;

      await expect(connectDB()).rejects.toThrow(/MONGODB_URI/);

      // Restore environment
      if (originalUri) {
        process.env.MONGODB_URI = originalUri;
      }
    });
  });
});
