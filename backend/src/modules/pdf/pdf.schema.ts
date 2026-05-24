import { z } from 'zod';

export const generatePdfSchema = z.object({
  body: z.object({
    program_id: z.string().uuid('Program ID must be a valid UUID'),
    application_id: z.string().uuid('Application ID must be a valid UUID').optional(),
  }),
});

export const validatePdfSchema = z.object({
  body: z.object({
    program_id: z.string().uuid('Program ID must be a valid UUID'),
  }),
});

export const pdfIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('PDF ID must be a valid UUID'),
  }),
});
