import { z } from 'zod';

export const listProgramsQuerySchema = z.object({
  query: z.object({
    state: z.string().optional(),
    type: z.string().optional(),
  }),
});

export const programIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const createProgramSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    agency: z.string().min(1),
    program_type: z.string().min(1),
    federal_or_state: z.string().min(1),
    state_code: z.string().nullable().optional(),
    description: z.string().min(1),
    eligibility_criteria: z.record(z.any()),
    estimated_monthly_value_min: z.number().min(0),
    estimated_monthly_value_max: z.number().min(0),
    application_url: z.string().url().nullable().optional(),
    is_active: z.boolean().default(true),
  }),
});

export const updateProgramSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    agency: z.string().min(1).optional(),
    program_type: z.string().min(1).optional(),
    federal_or_state: z.string().min(1).optional(),
    state_code: z.string().nullable().optional(),
    description: z.string().min(1).optional(),
    eligibility_criteria: z.record(z.any()).optional(),
    estimated_monthly_value_min: z.number().min(0).optional(),
    estimated_monthly_value_max: z.number().min(0).optional(),
    application_url: z.string().url().nullable().optional(),
    is_active: z.boolean().optional(),
  }),
});
