import bcrypt from 'bcryptjs';
import { Role, type User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../authService';
import type { CreateUserInput, UserRepository } from '../../repositories/userRepository';
import { isApiError } from '../../utils/apiError';
import { env } from '../../config/env';

/**
 * In-memory UserRepository so the service is tested in isolation from Prisma/Neon.
 */
class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();
  private sequence = 0;

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return { ...user };
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    this.sequence += 1;
    const now = new Date('2026-01-01T00:00:00.000Z');
    const user: User = {
      id: `user-${this.sequence}`,
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return { ...user };
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error(`No user ${id}`);
    const updated: User = { ...user, passwordHash };
    this.users.set(id, updated);
    return { ...updated };
  }

  // Test helper: seed a manager (or any role) directly with a known password.
  async seed(overrides: Partial<CreateUserInput> & { password: string }): Promise<User> {
    return this.create({
      fullName: overrides.fullName ?? 'Seeded User',
      phoneNumber: overrides.phoneNumber ?? null,
      email: overrides.email ?? 'seed@example.com',
      passwordHash: await bcrypt.hash(overrides.password, 4),
      role: overrides.role ?? Role.CUSTOMER,
    });
  }
}

const validRegister = {
  fullName: 'Ada Lovelace',
  phoneNumber: '+84 123 456 789',
  email: 'ada@example.com',
  password: 'sup3rsecret',
};

describe('AuthService', () => {
  let repo: InMemoryUserRepository;
  let service: AuthService;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    service = new AuthService(repo);
  });

  describe('register', () => {
    it('creates a customer, hashes the password, and returns a valid token', async () => {
      const result = await service.register(validRegister);

      expect(result.user).toMatchObject({
        fullName: 'Ada Lovelace',
        phoneNumber: '+84 123 456 789',
        email: 'ada@example.com',
        role: 'customer',
      });
      expect(result.user.id).toBeTruthy();

      // Password must be stored hashed, never as plain text.
      const stored = await repo.findByEmail('ada@example.com');
      expect(stored?.passwordHash).toBeDefined();
      expect(stored?.passwordHash).not.toBe(validRegister.password);
      await expect(bcrypt.compare(validRegister.password, stored!.passwordHash)).resolves.toBe(
        true,
      );

      // Token must verify and carry the user identity/claims.
      const payload = jwt.verify(result.token, env.jwtSecret) as jwt.JwtPayload;
      expect(payload.sub).toBe(result.user.id);
      expect(payload.email).toBe('ada@example.com');
      expect(payload.role).toBe('customer');
    });

    it('forces the customer role even if a manager role is somehow supplied', async () => {
      const result = await service.register({
        ...validRegister,
        // @ts-expect-error – role is not part of RegisterInput; this guards against leakage.
        role: 'manager',
      });
      expect(result.user.role).toBe('customer');
    });

    it('normalizes a missing phone number to null', async () => {
      const { phoneNumber, ...withoutPhone } = validRegister;
      void phoneNumber;
      const result = await service.register(withoutPhone);
      expect(result.user.phoneNumber).toBeNull();
    });

    it('rejects a duplicate email with a 409 conflict', async () => {
      await service.register(validRegister);

      await expect(service.register(validRegister)).rejects.toSatisfy((error: unknown) => {
        return isApiError(error) && error.statusCode === 409 && error.code === 'CONFLICT';
      });
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.register(validRegister);
    });

    it('returns the user and a fresh token for correct credentials', async () => {
      const result = await service.login({
        email: validRegister.email,
        password: validRegister.password,
      });

      expect(result.user.email).toBe('ada@example.com');
      const payload = jwt.verify(result.token, env.jwtSecret) as jwt.JwtPayload;
      expect(payload.sub).toBe(result.user.id);
    });

    it('rejects a wrong password with 401 and a generic message', async () => {
      await expect(
        service.login({ email: validRegister.email, password: 'wrong-password' }),
      ).rejects.toSatisfy((error: unknown) => {
        return (
          isApiError(error) &&
          error.statusCode === 401 &&
          error.message === 'Invalid email or password.'
        );
      });
    });

    it('rejects an unknown email with the same generic 401 (no account enumeration)', async () => {
      await expect(
        service.login({ email: 'nobody@example.com', password: 'whatever1' }),
      ).rejects.toSatisfy((error: unknown) => {
        return (
          isApiError(error) &&
          error.statusCode === 401 &&
          error.message === 'Invalid email or password.'
        );
      });
    });
  });

  describe('getCurrentUser', () => {
    it('returns the DTO for an existing user', async () => {
      const registered = await service.register(validRegister);
      const me = await service.getCurrentUser(registered.user.id);
      expect(me).toMatchObject({ id: registered.user.id, email: 'ada@example.com' });
      // DTO must not leak the password hash.
      expect(me).not.toHaveProperty('passwordHash');
    });

    it('throws 401 when the user no longer exists', async () => {
      await expect(service.getCurrentUser('missing-id')).rejects.toSatisfy(
        (error: unknown) => isApiError(error) && error.statusCode === 401,
      );
    });
  });

  describe('changePassword', () => {
    it('updates the hash when the current password is correct', async () => {
      const registered = await service.register(validRegister);

      const result = await service.changePassword(registered.user.id, {
        currentPassword: validRegister.password,
        newPassword: 'brand-new-pass',
      });
      expect(result.message).toBe('Password updated.');

      const stored = await repo.findById(registered.user.id);
      await expect(bcrypt.compare('brand-new-pass', stored!.passwordHash)).resolves.toBe(true);
      await expect(bcrypt.compare(validRegister.password, stored!.passwordHash)).resolves.toBe(
        false,
      );
    });

    it('rejects when the current password is incorrect', async () => {
      const registered = await service.register(validRegister);

      await expect(
        service.changePassword(registered.user.id, {
          currentPassword: 'not-the-password',
          newPassword: 'brand-new-pass',
        }),
      ).rejects.toSatisfy(
        (error: unknown) =>
          isApiError(error) &&
          error.statusCode === 401 &&
          error.message === 'The current password is incorrect.',
      );
    });

    it('throws 401 when the user no longer exists', async () => {
      await expect(
        service.changePassword('missing-id', {
          currentPassword: 'x',
          newPassword: 'brand-new-pass',
        }),
      ).rejects.toSatisfy((error: unknown) => isApiError(error) && error.statusCode === 401);
    });
  });

  describe('logout', () => {
    it('returns a confirmation message', async () => {
      await expect(service.logout()).resolves.toEqual({ message: 'Logged out.' });
    });
  });
});
