# MomPlan Frontend

Next.js 15 TypeScript app for the MomPlan government benefits platform.

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy env file
cp .env.example .env.local
# Set your API URL in .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, pricing |
| `/login` | JWT authentication |
| `/register` | Registration with plan selection |
| `/eligibility` | 4-step AI eligibility scan form |
| `/dashboard` | User overview dashboard |
| `/dashboard/benefits` | AI eligibility results + filtering |
| `/dashboard/applications` | Application status tracker |
| `/dashboard/documents` | S3 document upload + verification |
| `/dashboard/notifications` | Notification center |
| `/dashboard/sessions` | Counselor session booking |
| `/dashboard/settings` | Stripe subscription management |
| `/dashboard/profile` | Profile & password management |
| `/admin` | Admin analytics dashboard |
| `/admin/users` | Paginated user directory |

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **TailwindCSS** with custom design tokens
- **Framer Motion** for page animations
- **React Query** for server state
- **Zustand** for auth state
- **React Hook Form + Zod** for forms
- **Recharts** for admin analytics
- **Axios** with JWT interceptors

## Backend

Backend runs on port 5000. See `/backend/README.md` for setup.
