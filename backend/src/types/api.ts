import type { Request } from 'express';

export type ApiRole = 'customer' | 'manager';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: ApiRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
