import type { RequestHandler } from 'express';
import { notFound } from '../utils/apiError';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(notFound(req.originalUrl));
};
