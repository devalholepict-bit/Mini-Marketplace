const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const businessRoutes = require('./routes/business.routes');
const savedRoutes = require('./routes/saved.routes');
const interestRoutes = require('./routes/interest.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration with Vite fallback
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientUrl,
  credentials: true
}));

// Body parsing with reasonable size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (suppressed during test runs)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/investor/saved', savedRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api', healthRoutes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
