const express = require('express');
const {
  getMyBusiness,
  upsertMyBusiness,
  setPublishStatus
} = require('../controllers/business.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const {
  businessProfileSchema,
  publishSchema
} = require('../validators/business.validator');

const router = express.Router();

// Owner profile retrieval: requires authenticated business user
router.get('/me', authenticate, authorize('business'), getMyBusiness);

// Owner profile upsert (create or update): requires authenticated business user & valid body
router.put(
  '/me',
  authenticate,
  authorize('business'),
  validateBody(businessProfileSchema),
  upsertMyBusiness
);

// Owner profile publication toggle: requires authenticated business user & strict boolean body
router.patch(
  '/me/publish',
  authenticate,
  authorize('business'),
  validateBody(publishSchema),
  setPublishStatus
);

module.exports = router;
