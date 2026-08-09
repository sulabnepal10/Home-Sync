import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';

// Import routes
import profileRoutes from './routes/profileRoutes';
import householdRoutes from './routes/householdRoutes';
import expenseRoutes from './routes/expenseRoutes';
import loanRoutes from './routes/loanRoutes';
import choreRoutes, { choreAssignmentRouter } from './routes/choreRoutes';
import mealRoutes from './routes/mealRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import activityRoutes from './routes/activityRoutes'
import recurringBillRoutes from './routes/recurringBillRoutes';

// Initialize Express app
const app = express();

// ============ Middleware ============

// Security headers
app.use(helmet());

// Global rate limit (applied before body parsing so oversized/abusive
// request floods are rejected as cheaply as possible)
app.use(globalLimiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

// 2. Configure CORS middleware options
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============ Health Check ============

// Health check endpoint (no auth required)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API info endpoint (no auth required)
app.get('/api', (_req, res) => {
  res.json({
    name: 'HomeSync API',
    version: '1.0.0',
    description: 'Roommate Management Platform Backend API',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      household: '/api/household',
      expenses: '/api/expenses',
      loans: '/api/loans',
      chores: '/api/chores',
      meals: '/api/meals',
      inventory: '/api/inventory',
      recurringBills: '/api/recurring-bills',
      activity: '/api/activity',
    },
    documentation: 'https://github.com/homesync/docs',
  });
});

// ============ API Routes ============

// Profile routes
app.use('/api/profile', profileRoutes);

// Household routes
app.use('/api/household', householdRoutes);

// Expense routes
app.use('/api/expenses', expenseRoutes);

// Loan routes
app.use('/api/loans', loanRoutes);

// Chore routes
app.use('/api/chores', choreRoutes);

// Chore assignment routes (separate endpoint)
app.use('/api/chore-assignments', choreAssignmentRouter);

// Meal routes
app.use('/api/meals', mealRoutes);

// Inventory routes
app.use('/api/inventory', inventoryRoutes);

// Dashboard Activity
app.use('/api/activity', activityRoutes);

// Recurring bills
app.use('/api/recurring-bills', recurringBillRoutes);

// ============ Error Handling ============

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============ Server Startup ============

const PORT = config.port;

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log(`  HomeSync Backend Server`);
  console.log('='.repeat(50));
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`  API Info: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
  console.log('');
  // Required env vars are validated (and, if missing, fatal) in ./config on import,
  // so by the time we reach here the server is guaranteed to have them.
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
