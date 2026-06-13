import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.').max(120),
  phoneNumber: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, 'Phone number contains invalid characters.')
    .optional(),
  email: z.string().trim().toLowerCase().email('A valid email is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(100),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current password.',
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
