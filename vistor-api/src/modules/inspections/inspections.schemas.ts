import { z } from 'zod';

export const createInspectionSchema = z.object({
  reservationId: z.string().min(1),
  type: z.enum(['DELIVERY', 'RETURN']),
});

export const saveResultSchema = z.object({
  inspectionItemId: z.string().min(1),
  condition: z.enum(['OK', 'CAVEAT', 'DAMAGED', 'MISSING', 'NA']),
  notes: z.string().optional().nullable(),
  quantityFound: z.number().int().min(0).optional().nullable(),
});

export const completeInspectionSchema = z.object({
  confirmedByName: z.string().min(1, 'Nome do responsável é obrigatório'),
  notes: z.string().optional(),
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type SaveResultInput = z.infer<typeof saveResultSchema>;
export type CompleteInspectionInput = z.infer<typeof completeInspectionSchema>;
