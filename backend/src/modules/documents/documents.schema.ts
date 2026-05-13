import { z } from 'zod';

export const documentIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const uploadDocumentBodySchema = z.object({
  body: z.object({
    document_type: z.string().min(1),
    application_id: z.string().nullable().optional(),
  }),
});
