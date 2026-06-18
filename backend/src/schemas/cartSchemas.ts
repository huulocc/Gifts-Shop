import { z } from 'zod';

// Sequence Diagram - Step 3: DTO received and validated by CartController.
export const addToCartSchema = z.object({
  productId: z.union([z.string().trim().min(1), z.number().int().positive()]),
  quantity: z.number().int().positive(),
});

export type AddToCartDto = z.infer<typeof addToCartSchema>;

// Manage Cart - validate an absolute quantity update from the UI.
export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;
