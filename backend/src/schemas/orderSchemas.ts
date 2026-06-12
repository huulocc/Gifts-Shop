import { z } from 'zod';

export const orderStatusSchema = z.enum(['pending', 'placed', 'paid', 'cancelled', 'completed']);

export const updateOrderStatusSchema = z.object({
  orderStatus: orderStatusSchema,
});

export const managerOrderListQuerySchema = z.object({
  scope: z.string().optional(),
  status: orderStatusSchema.optional(),
  query: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ManagerOrderListQuery = z.infer<typeof managerOrderListQuerySchema>;
