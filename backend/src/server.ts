import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const startServer = async () => {
  // ─── 1. Database Connection ────────────────────────────────────────
  let dbConnected = false;
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database via Prisma ORM');
    dbConnected = true;
  } catch (dbError: any) {
    if (env.NODE_ENV === 'development') {
      console.warn('⚠️  PostgreSQL connection failed — server starting WITHOUT database.');
      console.warn('   Ensure PostgreSQL is running and DATABASE_URL is correct in .env');
      console.warn(`   Error: ${dbError.message}\n`);
    } else {
      console.error('❌ PostgreSQL connection failed in production — shutting down.', dbError);
      process.exit(1);
    }
  }

  // ─── 2. Background Job Scheduler (only if DB is up) ───────────────
  if (dbConnected) {
    try {
      const { startBackgroundScheduler } = await import('./jobs/scheduler');
      await startBackgroundScheduler();
      console.log('✅ Background task scheduler started');
    } catch (jobError: any) {
      console.warn('⚠️  Background tasks failed to start.');
      console.warn(`   Error: ${jobError.message}\n`);
    }
  }

  // ─── 3. HTTP Server ────────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    console.log(`\n🚀 MomPlan Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`🔗 CORS origin: ${env.FRONTEND_URL}`);
    if (!dbConnected) {
      console.log('⚠️  API health endpoint is up but database routes will fail until PostgreSQL is available.');
    }
    console.log('\nReady to accept requests.\n');
  });

  // ─── 4. Graceful Shutdown ──────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal} — shutting down gracefully...`);
    server.close(async () => {
      if (dbConnected) {
        await prisma.$disconnect();
      }
      console.log('👋 Server shutdown complete.');
      process.exit(0);
    });

    // Force-kill after 10 seconds if shutdown hangs
    setTimeout(() => {
      console.error('⏱️  Shutdown timeout — forcing exit.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught exception:', err);
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled promise rejection:', reason);
    shutdown('unhandledRejection');
  });
};

startServer();
