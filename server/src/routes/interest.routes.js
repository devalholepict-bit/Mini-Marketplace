const express = require('express');
const {
  createInterest,
  getSentInterests,
  getReceivedInterests,
  updateInterestStatus
} = require('../controllers/interest.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const {
  validateBody,
  validateParams
} = require('../middleware/validate.middleware');
const {
  createInterestSchema,
  updateInterestStatusSchema,
  interestIdParamSchema
} = require('../validators/interest.validator');

const router = express.Router();

// POST /api/interests - Investor expresses interest in a published business
router.post(
  '/',
  authenticate,
  authorize('investor'),
  validateBody(createInterestSchema),
  createInterest
);

// GET /api/interests/sent - Investor lists their sent expressions of interest
router.get(
  '/sent',
  authenticate,
  authorize('investor'),
  getSentInterests
);

// GET /api/interests/received - Business founder lists received expressions of interest
router.get(
  '/received',
  authenticate,
  authorize('business'),
  getReceivedInterests
);

// PATCH /api/interests/:id/status - Business founder accepts or declines a pending interest
router.patch(
  '/:id/status',
  authenticate,
  authorize('business'),
  validateParams(interestIdParamSchema),
  validateBody(updateInterestStatusSchema),
  updateInterestStatus
);

module.exports = router;
