const express = require('express');
const {
  saveBusiness,
  getSavedBusinesses,
  unsaveBusiness
} = require('../controllers/saved.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { validateParams } = require('../middleware/validate.middleware');
const { savedBusinessParamSchema } = require('../validators/saved.validator');

const router = express.Router();

// All saved business routes require authentication and the 'investor' role
router.use(authenticate, authorize('investor'));

// GET /api/investor/saved - List saved businesses for current investor
router.get('/', getSavedBusinesses);

// POST /api/investor/saved/:businessId - Save a published business
router.post(
  '/:businessId',
  validateParams(savedBusinessParamSchema),
  saveBusiness
);

// DELETE /api/investor/saved/:businessId - Remove business from saved list
router.delete(
  '/:businessId',
  validateParams(savedBusinessParamSchema),
  unsaveBusiness
);

module.exports = router;
