import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import Feature Routers
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import eligibilityRoutes from './modules/eligibility/eligibility.routes';
import programsRoutes from './modules/programs/programs.routes';
import applicationsRoutes from './modules/applications/applications.routes';
import documentsRoutes from './modules/documents/documents.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import deadlinesRoutes from './modules/deadlines/deadlines.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import billingRoutes from './modules/billing/billing.routes';
import adminRoutes from './modules/admin/admin.routes';

const app: Application = express();

// Security Middleware
app.use(helmet());

// CORS Configured exclusively for frontend domain as specified
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// Apply billing router before global body parsers to permit raw Buffer capture on /api/billing/webhook
app.use('/api/billing', billingRoutes);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply General Rate Limiting to all general API surface endpoints
app.use('/api', apiLimiter);

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/deadlines', deadlinesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
