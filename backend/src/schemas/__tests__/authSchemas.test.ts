import { describe, expect, it } from 'vitest';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from '../authSchemas';

describe('registerSchema', () => {
  const base = {
    fullName: 'Ada Lovelace',
    email: 'ADA@Example.com',
    password: 'sup3rsecret',
  };

  it('accepts a valid payload and normalizes the email to lowercase', () => {
    const parsed = registerSchema.parse(base);
    expect(parsed.email).toBe('ada@example.com');
  });

  it('trims whitespace from the full name', () => {
    const parsed = registerSchema.parse({ ...base, fullName: '  Ada Lovelace  ' });
    expect(parsed.fullName).toBe('Ada Lovelace');
  });

  it('treats phoneNumber as optional', () => {
    const parsed = registerSchema.parse(base);
    expect(parsed.phoneNumber).toBeUndefined();
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ ...base, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a short password (< 8 chars)', () => {
    const result = registerSchema.safeParse({ ...base, password: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'password')).toBe(true);
    }
  });

  it('rejects a phone number with invalid characters', () => {
    const result = registerSchema.safeParse({ ...base, phoneNumber: 'abc-phone' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty full name', () => {
    const result = registerSchema.safeParse({ ...base, fullName: '   ' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials and lowercases the email', () => {
    const parsed = loginSchema.parse({ email: 'ADA@Example.com', password: 'x' });
    expect(parsed.email).toBe('ada@example.com');
  });

  it('rejects a missing password', () => {
    const result = loginSchema.safeParse({ email: 'ada@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts a valid change', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when the new password is shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when the new password equals the current one', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'same-password',
      newPassword: 'same-password',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'newPassword')).toBe(true);
    }
  });

  it('rejects a missing current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'new-password',
    });
    expect(result.success).toBe(false);
  });
});
