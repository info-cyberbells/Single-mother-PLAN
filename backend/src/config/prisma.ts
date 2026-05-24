import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const base = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  // Extend with Neon auto-suspend retry (Prisma 5+ / 6 API)
  // E57P01 = "terminating connection due to administrator command" — fired when
  // Neon's serverless compute suspends and invalidates pooled connections.
  // We pause 1.5 s for the compute to wake, then retry the operation once.
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          try {
            return await query(args);
          } catch (error: any) {
            const isNeonSuspend =
              error?.message?.includes('terminating connection due to administrator command') ||
              error?.message?.includes('E57P01') ||
              error?.code === 'P1001' ||
              error?.code === 'P1017';

            if (isNeonSuspend) {
              console.warn('⚠️  Neon compute resumed — retrying query after connection reset…');
              await new Promise((resolve) => setTimeout(resolve, 1500));
              return await query(args);
            }

            throw error;
          }
        },
      },
    },
  });
}

// PrismaClient with $extends returns an extended type — use 'any' for the global cache
// to avoid complex type gymnastics while still benefiting from type safety at call sites.
export const prisma: ReturnType<typeof createPrismaClient> =
  (global as any).prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}
