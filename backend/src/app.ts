import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { responseSanitizer } from './middleware/sanitize';

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
import pdfRoutes from './modules/pdf/pdf.routes';

const app: Application = express();

// Trust proxy for secure, accurate client IP rate-limiting behind Render/Vercel/reverse proxies
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

// CORS Configured exclusively for frontend domain as specified
const allowedOrigins = [
  env.FRONTEND_URL.replace(/\/$/, ''),
  env.ADMIN_FRONTEND_URL.replace(/\/$/, '')
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Required so browsers send/receive httpOnly cookies
  })
);

// Parse httpOnly cookies (used for secure auth token storage)
app.use(cookieParser());

// Apply billing router before global body parsers to permit raw Buffer capture on /api/billing/webhook
app.use('/api/billing', billingRoutes);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply General Rate Limiting to all general API surface endpoints
app.use('/api', apiLimiter);

// Response sanitizer: strips sensitive PII fields (ssn_last_four, password_hash, etc.)
// from ALL outbound JSON responses before they reach the client
app.use(responseSanitizer);

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
app.use('/api/pdf', pdfRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
