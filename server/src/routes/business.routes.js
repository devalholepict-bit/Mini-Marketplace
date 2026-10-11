const express = require('express');
const {
  getMyBusiness,
  upsertMyBusiness,
  setPublishStatus,
  listBusinesses,
  getBusinessById
} = require('../controllers/business.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const {
  validateBody,
  validateQuery,
  validateParams
} = require('../middleware/validate.middleware');
const {
  businessProfileSchema,
  publishSchema,
  businessQuerySchema,
  businessIdParamSchema
} = require('../validators/business.validator');

const router = express.Router();

// Owner profile routes (must be registered before /:id)
router.get('/me', authenticate, authorize('business'), getMyBusiness);

router.put(
  '/me',
  authenticate,
  authorize('business'),
  validateBody(businessProfileSchema),
  upsertMyBusiness
);

router.patch(
  '/me/publish',
  authenticate,
  authorize('business'),
  validateBody(publishSchema),
  setPublishStatus
);

// Marketplace discovery listing: investors only with search, filters, pagination
router.get(
  '/',
  authenticate,
  authorize('investor'),
  validateQuery(businessQuerySchema),
  listBusinesses
);

// Business detail endpoint: authenticated users, with role-based private field protection
router.get(
  '/:id',
  authenticate,
  validateParams(businessIdParamSchema),
  getBusinessById
);

module.exports = router;
