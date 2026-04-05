import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';

// Config imports
import swaggerSpec from './config/swagger.js';
import { apiLimiter, authLimiter } from './config/rateLimit.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors());

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── NoSQL Injection Protection ──────────────────────────────
// Express 5 makes req.query immutable, which breaks express-mongo-sanitize. 
// We must make it writable before the sanitization middleware runs.
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(mongoSanitize());

// ─── Rate Limiting ───────────────────────────────────────────
if ((process.env.NODE_ENV || '').trim() !== 'test') {
  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);
}

// ─── Logging ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── API Documentation ──────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance API Documentation',
}));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance Backend API is running',
    timestamp: new Date().toISOString(),
    docs: '/api/docs',
  });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use('{*path}', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

export default app;
