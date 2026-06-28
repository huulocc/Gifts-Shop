import { z } from 'zod';

export const orderStatusSchema = z.enum(['pending', 'placed', 'paid', 'cancelled', 'completed']);

export const paymentMethodSchema = z.enum(['cash', 'credit_card', 'paypal', 'bank_transfer']);

export const shippingAddressSchema = z.object({
  state: z.string().trim().min(1, 'State is required.').max(100),
  city: z.string().trim().min(1, 'City is required.').max(100),
  street: z.string().trim().min(1, 'Street is required.').max(160),
  buildingNumber: z.string().trim().min(1, 'Building number is required.').max(60),
});

export const createOrderSchema = z.object({
  recipientName: z.string().trim().min(1, 'Recipient name is required.').max(100),
  recipientPhone: z.string().trim().min(1, 'Recipient phone is required.').max(30),
  giftMessage: z.string().trim().max(240).optional().nullable(),
  paymentMethod: paymentMethodSchema,
  shippingAddress: shippingAddressSchema,
  voucherCode: z.string().trim().max(50).optional().nullable(),
});

export const applyVoucherSchema = z.object({
  voucherCode: z.string().trim().min(1, 'Voucher code is required.').max(50),
});

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
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ApplyVoucherInput = z.infer<typeof applyVoucherSchema>;
