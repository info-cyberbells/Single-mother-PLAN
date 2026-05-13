import { z } from 'zod';

export const getResultParamSchema = z.object({
  params: z.object({
    programId: z.string().min(1),
  }),
});
