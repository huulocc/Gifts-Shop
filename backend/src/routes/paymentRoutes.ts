import { Router } from 'express';
import { controllers } from '../container';
import { requireAuth, requireRole } from '../middleware/auth';

export function paymentRoutes(): Router {
  const router = Router();

  router.post('/', requireRole('customer'), controllers.payments.recordPayment);
  router.get('/', requireAuth, controllers.payments.getOrderPayments);

  return router;
}
