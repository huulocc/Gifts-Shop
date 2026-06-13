import type { CookieOptions, Response } from 'express';
import type { AuthenticatedRequest } from '../types/api';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from '../schemas/authSchemas';
import { AuthService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';
import { unauthenticated } from '../utils/apiError';
import { env } from '../config/env';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  };
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = asyncHandler(async (req, res) => {
    const result = await this.authService.register(req.body as RegisterInput);
    res.cookie(env.sessionCookieName, result.token, sessionCookieOptions());
    sendData(res, result, 201);
  });

  login = asyncHandler(async (req, res) => {
    const result = await this.authService.login(req.body as LoginInput);
    res.cookie(env.sessionCookieName, result.token, sessionCookieOptions());
    sendData(res, result);
  });

  logout = asyncHandler(async (_req, res) => {
    res.clearCookie(env.sessionCookieName, { path: '/' });
    const data = await this.authService.logout();
    sendData(res, data);
  });

  me = asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) throw unauthenticated();
    const data = await this.authService.getCurrentUser(authReq.user.id);
    sendData(res as Response, data);
  });

  changePassword = asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) throw unauthenticated();
    const data = await this.authService.changePassword(
      authReq.user.id,
      req.body as ChangePasswordInput,
    );
    sendData(res as Response, data);
  });
}
