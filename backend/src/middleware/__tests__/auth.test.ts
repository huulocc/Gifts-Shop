import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import {
  assertCustomer,
  assertManager,
  authenticateOptional,
  requireAuth,
  requireRole,
  signSessionToken,
} from '../auth';
import type { AuthenticatedRequest, AuthenticatedUser } from '../../types/api';
import { isApiError } from '../../utils/apiError';
import { env } from '../../config/env';

const customer: AuthenticatedUser = {
  id: 'user-1',
  email: 'ada@example.com',
  role: 'customer',
};

function makeReq(
  options: { cookieToken?: string; bearer?: string } = {},
): AuthenticatedRequest {
  const cookies = options.cookieToken
    ? { [env.sessionCookieName]: options.cookieToken }
    : {};
  return {
    cookies,
    header(name: string) {
      if (name.toLowerCase() === 'authorization' && options.bearer) {
        return `Bearer ${options.bearer}`;
      }
      return undefined;
    },
  } as unknown as AuthenticatedRequest;
}

const noopRes = {} as never;

describe('signSessionToken', () => {
  it('produces a token that verifies with the configured secret', () => {
    const token = signSessionToken(customer);
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('ada@example.com');
    expect(payload.role).toBe('customer');
    expect(payload.exp).toBeTypeOf('number');
  });
});

describe('authenticateOptional', () => {
  it('continues with no user when no token is present', () => {
    const req = makeReq();
    const next = vi.fn();
    authenticateOptional(req, noopRes, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });

  it('attaches the user when a valid cookie token is present', () => {
    const token = signSessionToken(customer);
    const req = makeReq({ cookieToken: token });
    const next = vi.fn();
    authenticateOptional(req, noopRes, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(customer);
  });

  it('attaches the user from a Bearer authorization header', () => {
    const token = signSessionToken(customer);
    const req = makeReq({ bearer: token });
    const next = vi.fn();
    authenticateOptional(req, noopRes, next);
    expect(req.user).toEqual(customer);
  });

  it('passes a 401 to next when the token is invalid', () => {
    const req = makeReq({ cookieToken: 'garbage.token.value' });
    const next = vi.fn();
    authenticateOptional(req, noopRes, next);
    const error = next.mock.calls[0][0];
    expect(isApiError(error) && error.statusCode).toBe(401);
  });

  it('passes a 401 to next when the token is signed with the wrong secret', () => {
    const token = jwt.sign({ email: customer.email, role: 'customer' }, 'wrong-secret', {
      subject: customer.id,
    });
    const req = makeReq({ cookieToken: token });
    const next = vi.fn();
    authenticateOptional(req, noopRes, next);
    const error = next.mock.calls[0][0];
    expect(isApiError(error) && error.statusCode).toBe(401);
  });
});

describe('requireAuth', () => {
  it('rejects with 401 when there is no token', () => {
    const req = makeReq();
    const next = vi.fn();
    requireAuth(req, noopRes, next);
    const error = next.mock.calls[0][0];
    expect(isApiError(error) && error.statusCode).toBe(401);
  });

  it('calls next() with no error for a valid token', () => {
    const req = makeReq({ cookieToken: signSessionToken(customer) });
    const next = vi.fn();
    requireAuth(req, noopRes, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('requireRole', () => {
  it('allows a matching role', () => {
    const req = makeReq({ cookieToken: signSessionToken(customer) });
    const next = vi.fn();
    requireRole('customer')(req, noopRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('forbids a mismatched role with 403', () => {
    const req = makeReq({ cookieToken: signSessionToken(customer) });
    const next = vi.fn();
    requireRole('manager')(req, noopRes, next);
    const error = next.mock.calls[0][0];
    expect(isApiError(error) && error.statusCode).toBe(403);
  });

  it('rejects an unauthenticated request with 401 before checking the role', () => {
    const req = makeReq();
    const next = vi.fn();
    requireRole('manager')(req, noopRes, next);
    const error = next.mock.calls[0][0];
    expect(isApiError(error) && error.statusCode).toBe(401);
  });
});

describe('assertManager / assertCustomer', () => {
  it('assertManager throws 401 when unauthenticated', () => {
    expect(() => assertManager(makeReq())).toThrowError(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('assertManager throws 403 for a customer', () => {
    const req = makeReq();
    req.user = customer;
    expect(() => assertManager(req)).toThrowError(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it('assertManager passes for a manager', () => {
    const req = makeReq();
    req.user = { ...customer, role: 'manager' };
    expect(() => assertManager(req)).not.toThrow();
  });

  it('assertCustomer passes for a customer', () => {
    const req = makeReq();
    req.user = customer;
    expect(() => assertCustomer(req)).not.toThrow();
  });
});
