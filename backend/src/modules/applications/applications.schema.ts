import { z } from 'zod';

export const applicationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const createApplicationSchema = z.object({
  body: z.object({
    program_id: z.string().min(1),
    notes: z.string().optional(),
    priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
  }),
});

export const updateApplicationSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z
      .enum(['draft', 'submitted', 'under_review', 'action_required', 'approved', 'rejected', 'withdrawn'])
      .optional(),
    notes: z.string().nullable().optional(),
    priority: z.enum(['normal', 'high', 'urgent']).optional(),
    assigned_admin_id: z.string().nullable().optional(),
  }),
});

export const applyApplicationSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    subject: z.string().optional(),
    body: z.string().optional(),
    to: z.string().email().optional(),
  }),
});
