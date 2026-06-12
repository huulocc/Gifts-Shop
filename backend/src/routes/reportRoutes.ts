import { Router } from 'express';
import { controllers } from '../container';
import { requireRole } from '../middleware/auth';

export function reportRoutes(): Router {
  const router = Router();

  router.get('/revenue', requireRole('manager'), controllers.reports.getRevenueSummary);

  return router;
}
