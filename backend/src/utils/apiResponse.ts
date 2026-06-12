import type { Response } from 'express';
import type { ApiSuccess } from '../types/api';

export function sendData<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  const payload: ApiSuccess<T> = message ? { data, message } : { data };
  res.status(statusCode).json(payload);
}
