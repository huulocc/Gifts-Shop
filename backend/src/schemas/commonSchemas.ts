import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const positiveQuantitySchema = z.object({
  quantity: z.number().int().positive(),
});
