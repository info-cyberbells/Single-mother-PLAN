import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    // Family Profile fields allowed in main profile update for convenience
    household_size: z.number().int().min(1).optional(),
    num_children: z.number().int().min(0).optional(),
    children_ages: z.array(z.number()).optional(),
    monthly_income: z.number().min(0).optional(),
    employment_status: z.string().min(1).optional(),
    housing_status: z.string().min(1).optional(),
    has_disability: z.boolean().optional(),
    is_pregnant: z.boolean().optional(),
    citizenship_status: z.boolean().optional(),
    
    // New Wiser Moms fields
    needs_childcare: z.boolean().optional(),
    monthly_rent: z.number().min(0).optional(),
    eviction_risk: z.boolean().optional(),
    domestic_violence: z.boolean().optional(),
    chronic_illness: z.boolean().optional(),
    immigration_status: z.string().optional(),
    date_of_birth: z.string().optional(), // ISO string or format
    preferred_language: z.string().optional(),
    marital_status: z.string().optional(),
    other_adults: z.boolean().optional(),
    income_sources: z.array(z.string()).optional(),
    work_situation: z.string().optional(),
    health_insurance: z.string().optional(),
    savings_assets: z.string().optional(),
    child_support_status: z.string().optional(),
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
