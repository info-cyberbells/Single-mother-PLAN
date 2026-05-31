import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().or(z.literal('')).optional(),
    phone: z.string().nullable().or(z.literal('')).optional(),
    email: z.string().email().or(z.literal('')).nullable().optional(),
    state: z.string().nullable().or(z.literal('')).optional(),
    zip_code: z.string().nullable().or(z.literal('')).optional(),
    profile_picture: z.string().nullable().or(z.literal('')).optional(),
    // Family Profile fields allowed in main profile update for convenience
    household_size: z.number().int().min(1).optional(),
    num_children: z.number().int().min(0).optional(),
    children_ages: z.array(z.number()).optional(),
    monthly_income: z.number().min(0).optional(),
    employment_status: z.string().nullable().or(z.literal('')).optional(),
    housing_status: z.string().nullable().or(z.literal('')).optional(),
    has_disability: z.boolean().optional(),
    is_pregnant: z.boolean().optional(),
    citizenship_status: z.boolean().optional(),
    
    // New Wiser Moms fields
    needs_childcare: z.boolean().optional(),
    monthly_rent: z.number().min(0).optional(),
    monthly_utilities: z.number().min(0).optional(),
    eviction_risk: z.boolean().optional(),
    domestic_violence: z.boolean().optional(),
    chronic_illness: z.boolean().optional(),
    immigration_status: z.string().nullable().or(z.literal('')).optional(),
    date_of_birth: z.string().nullable().or(z.literal('')).optional(), // ISO string or format
    ssn_last_four: z.string().max(4).nullable().or(z.literal('')).optional(),
    first_name: z.string().nullable().or(z.literal('')).optional(),
    last_name: z.string().nullable().or(z.literal('')).optional(),
    children_dobs: z.array(z.string()).optional(),
    preferred_language: z.string().nullable().or(z.literal('')).optional(),
    marital_status: z.string().nullable().or(z.literal('')).optional(),
    other_adults: z.boolean().optional(),
    income_sources: z.array(z.string()).optional(),
    work_situation: z.string().nullable().or(z.literal('')).optional(),
    employer_name: z.string().nullable().or(z.literal('')).optional(),
    health_insurance: z.string().nullable().or(z.literal('')).optional(),
    savings_assets: z.string().nullable().or(z.literal('')).optional(),
    child_support_status: z.string().nullable().or(z.literal('')).optional(),
    monthly_childcare_cost: z.number().nullable().optional(),
    childcare_preference: z.string().nullable().or(z.literal('')).optional(),
    childcare_provider: z.string().nullable().or(z.literal('')).optional(),
    legal_issues: z.array(z.string()).optional(),
    urgency: z.string().nullable().or(z.literal('')).optional(),
    // Address fields
    street_address: z.string().nullable().or(z.literal('')).optional(),
    city: z.string().nullable().or(z.literal('')).optional(),
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
