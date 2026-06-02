import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ override: true });

const envSchema = z.object({
  // ─── Core ──────────────────────────────────────────────────────────
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  ADMIN_FRONTEND_URL: z.string().default('http://localhost:3001'),

  // ─── Database ──────────────────────────────────────────────────────────
  // Supabase: DATABASE_URL = pooled connection via Supavisor (runtime queries, port 6543)
  //           DIRECT_URL   = direct connection (Prisma migrations only, port 5432)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid postgresql:// URL'),
  DIRECT_URL: z.string().default(''),

  // ─── Redis ─────────────────────────────────────────────────────────
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // ─── Auth ──────────────────────────────────────────────────────────
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').optional(),
  SUPABASE_ANON_KEY: z.string().optional(),

  // ─── External APIs (optional in dev — services will mock gracefully) ─
  ANTHROPIC_API_KEY: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  S3_BUCKET_NAME: z.string().default('momplan-documents-dev'),
  AWS_REGION: z.string().default('us-east-1'),
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM_EMAIL: z.string().default('MomPlan Notifications <notifications@momplan.gov-assist.com>'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  const formatted = _env.error.format();
  Object.entries(formatted).forEach(([key, val]) => {
    if (key !== '_errors' && typeof val === 'object' && '_errors' in val) {
      console.error(`  ✗ ${key}: ${(val as any)._errors.join(', ')}`);
    }
  });
  console.error('\nFix the above variables in your .env file and restart.');
  process.exit(1);
}

export const env = _env.data;

// Warn about missing optional service keys in development
if (env.NODE_ENV === 'development') {
  const optionalKeys: (keyof typeof env)[] = [
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'RESEND_API_KEY',
  ];

  const missing = optionalKeys.filter((k) => !env[k]);
  if (missing.length > 0) {
    console.warn(
      `⚠️  Dev mode: Missing optional service keys — these features will be mocked:\n   ${missing.join(', ')}\n`
    );
  }
}
