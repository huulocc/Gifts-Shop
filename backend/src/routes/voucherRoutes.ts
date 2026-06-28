import { Router } from 'express';
import { controllers } from '../container';
import { requireRole } from '../middleware/auth';

export function voucherRoutes(): Router {
  const router = Router();

  router.post('/apply', requireRole('customer'), controllers.vouchers.applyVoucher);

  return router;
}
