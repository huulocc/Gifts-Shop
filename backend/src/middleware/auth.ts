import type { NextFunction, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import type { ApiRole, AuthenticatedRequest, AuthenticatedUser } from '../types/api';
import { forbidden, unauthenticated } from '../utils/apiError';
import { parseApiRole } from '../utils/enums';

interface SessionTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: ApiRole;
}

function readToken(req: AuthenticatedRequest): string | null {
  const cookieToken = req.cookies?.[env.sessionCookieName];
  if (typeof cookieToken === 'string' && cookieToken.trim()) return cookieToken;

  const authorization = req.header('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  return null;
}

export function signSessionToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: '7d',
    },
  );
}

export function authenticateOptional(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = readToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as SessionTokenPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: parseApiRole(payload.role),
    };
    next();
  } catch {
    next(unauthenticated('Session token is invalid or expired.'));
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateOptional(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }
    if (!req.user) {
      next(unauthenticated());
      return;
    }
    next();
  });
}

// Sequence Diagram - Step 2: verify the JWT before Add To Cart reaches the controller.
export function verifyAddToCartToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  authenticateOptional(req, res, (error?: unknown) => {
    if (error || !req.user) {
      res.status(401).json({
        success: false,
        message: 'Please login to add product to cart',
      });
      return;
    }

    if (req.user.role !== 'customer') {
      next(forbidden('The customer role is required.'));
      return;
    }

    next();
  });
}

export function requireRole(role: ApiRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    requireAuth(req, res, (error?: unknown) => {
      if (error) {
        next(error);
        return;
      }
      if (req.user?.role !== role) {
        next(forbidden(`The ${role} role is required.`));
        return;
      }
      next();
    });
  };
}

export function assertManager(req: AuthenticatedRequest): void {
  if (!req.user) throw unauthenticated();
  if (req.user.role !== 'manager') throw forbidden('The manager role is required.');
}

export function assertCustomer(req: AuthenticatedRequest): void {
  if (!req.user) throw unauthenticated();
  if (req.user.role !== 'customer') throw forbidden('The customer role is required.');
}
