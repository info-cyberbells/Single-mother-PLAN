import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: ['error', 'warn'],
  });
}

// Reuse a single PrismaClient instance in development to avoid connection pool exhaustion
export const prisma: PrismaClient =
  (global as any).prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}
