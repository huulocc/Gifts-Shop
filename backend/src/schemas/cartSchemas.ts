import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.union([z.string().trim().min(1), z.number().int().positive()]),
  quantity: z.number().int().positive(),
});

export type AddToCartDto = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;
