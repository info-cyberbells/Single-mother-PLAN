import { z } from 'zod';

export const partnerRegisterSchema = z.object({
  body: z.object({
    // Organization (step 0)
    orgName:     z.string().min(2, 'Organization name is required'),
    orgType:     z.string().min(1, 'Organization type is required'),
    website:     z.string().url('Invalid URL').or(z.literal('')).optional(),
    description: z.string().max(1000).optional(),

    // Contact / location (step 1)
    email:   z.string().email('Invalid contact email'),
    phone:   z.string().optional(),
    address: z.string().min(3, 'Street address is required'),
    city:    z.string().min(1, 'City is required'),
    state:   z.string().optional(),
    zip:     z.string().optional(),
    country: z.string().optional(),

    // Admin account (step 2)
    adminName:     z.string().min(2, 'Admin full name is required'),
    adminEmail:    z.string().email('Invalid admin email'),
    adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
    employees:     z.string().optional(),
    founded:       z.string().optional(),
    taxId:         z.string().optional(),
    linkedin:      z.string().url('Invalid URL').or(z.literal('')).optional(),
  }),
});

export const partnerLoginSchema = z.object({
  body: z.object({
    email:    z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const partnerRefreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const partnerChangePasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});
