const express = require('express');
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/dashboard/stats - Retrieve role-based statistics for authenticated user
router.get('/stats', authenticate, getDashboardStats);

module.exports = router;
