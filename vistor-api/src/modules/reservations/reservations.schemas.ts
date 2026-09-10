import { z } from 'zod';

export const createReservationSchema = z.object({
  areaId: z.string().min(1),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  responsibleName: z.string().min(1, 'Nome do responsável é obrigatório'),
  responsiblePhone: z.string().optional(),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
});

export const updateReservationSchema = z.object({
  unit: z.string().min(1).optional(),
  responsibleName: z.string().min(1).optional(),
  responsiblePhone: z.string().optional(),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida').optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
  status: z.enum(['SCHEDULED', 'DELIVERY_INSPECTION', 'IN_USE', 'AWAITING_RETURN', 'COMPLETED', 'CANCELLED']).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
