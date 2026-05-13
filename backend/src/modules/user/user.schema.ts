import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
  }),
});

export const updateFamilyProfileSchema = z.object({
  body: z.object({
    household_size: z.number().int().min(1),
    num_children: z.number().int().min(0),
    children_ages: z.array(z.number()),
    monthly_income: z.number().min(0),
    employment_status: z.string().min(1),
    housing_status: z.string().min(1),
    has_disability: z.boolean().default(false),
    is_pregnant: z.boolean().default(false),
  }),
});
