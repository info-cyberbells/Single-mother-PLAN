import { z } from 'zod';

export const checkoutBodySchema = z.object({
  body: z.object({
    plan: z.enum(['free', 'family', 'navigator']),
  }),
});
