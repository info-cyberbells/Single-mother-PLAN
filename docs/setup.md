# Developer Setup Guide

## Prerequisites
- Node.js (v18+)
- npm or yarn or pnpm
- Git
- **Supabase** project (free tier available at https://supabase.com)
- Stripe account
- AWS S3 bucket (or local mock for uploads)
- Redis server (local or Upstash free tier)

## Step 1: Clone the Repository
```bash
git clone <repo-url>
cd Client
```

## Step 2: Install Dependencies
The project contains three main folders:
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install admin frontend dependencies
cd ../frontend_admin && npm install
```

## Step 3: Environment Configuration
Copy `.env.example` to `.env` in each respective folder.

### Backend (`backend/.env`)
Get your Supabase connection strings from: **Supabase Dashboard → Project → Settings → Database → Connection Pooling**

```
# Pooled connection (Supavisor transaction mode, port 6543) — runtime queries
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10

# Direct connection (port 5432) — Prisma migrations only
DIRECT_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

Also set your Stripe keys, AWS credentials, JWT secrets, and Redis URL.

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Admin Frontend (`frontend_admin/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Step 4: Database Setup (Prisma + Supabase)
Inside `backend/`:
```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase (uses DIRECT_URL for migrations)
npx prisma db push
```

> **Note:** The `DIRECT_URL` is required for Prisma migrations (bypasses the PgBouncer pooler).

## Step 5: Start Development Servers
You need to run all three services concurrently or in separate terminal windows.

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend User):
```bash
cd frontend
npm run dev
```

Terminal 3 (Admin Portal):
```bash
cd frontend_admin
npm run dev
```
