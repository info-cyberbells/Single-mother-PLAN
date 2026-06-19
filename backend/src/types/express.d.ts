import { UserRole, UserPlan } from '@prisma/client';
import type { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      log?: Logger;
      user?: {
        id: string;
        email: string;
        role: UserRole;
        plan: UserPlan;
      };
      orgUser?: {
        orgUserId: string;
        email: string;
        role: string;
        orgId: string;
      };
    }
  }
}
