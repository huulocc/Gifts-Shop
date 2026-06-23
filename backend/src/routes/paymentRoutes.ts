import { Router } from 'express';
import { controllers } from '../container';
import { requireAuth } from '../middleware/auth';

export function paymentRoutes(): Router {
  const router = Router();

  router.get('/', requireAuth, controllers.payments.getOrderPayments);

  return router;
}
