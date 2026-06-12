import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/api';
import { AuthService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';
import { env } from '../config/env';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = asyncHandler(async (req, res) => {
    const data = await this.authService.register();
    sendData(res, data, 201);
  });

  login = asyncHandler(async (req, res) => {
    const data = await this.authService.login();
    sendData(res, data);
  });

  logout = asyncHandler(async (_req, res) => {
    res.clearCookie(env.sessionCookieName);
    const data = await this.authService.logout();
    sendData(res, data);
  });

  me = asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      sendData(res as Response, authReq.user);
      return;
    }
    const data = await this.authService.getCurrentUser();
    sendData(res, data);
  });

  changePassword = asyncHandler(async (_req, res) => {
    const data = await this.authService.changePassword();
    sendData(res, data);
  });
}
