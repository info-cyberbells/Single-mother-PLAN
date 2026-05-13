import { z } from 'zod';

export const deadlineIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const createDeadlineSchema = z.object({
  body: z.object({
    application_id: z.string().min(1),
    deadline_type: z.string().min(1),
    due_date: z.string().datetime().or(z.string()),
  }),
});
