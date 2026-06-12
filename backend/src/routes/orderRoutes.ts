import { Router } from 'express';
import { controllers } from '../container';
import { authenticateOptional, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { managerOrderListQuerySchema, updateOrderStatusSchema } from '../schemas/orderSchemas';

export function orderRoutes(): Router {
  const router = Router();

  router.post('/', requireRole('customer'), controllers.orders.createOrder);
  router.get('/', authenticateOptional, validateQuery(managerOrderListQuerySchema), controllers.orders.listOrders);
  router.get('/:id', authenticateOptional, controllers.orders.getOrder);
  router.patch(
    '/:id/status',
    requireRole('manager'),
    validateBody(updateOrderStatusSchema),
    controllers.orders.updateStatus,
  );

  return router;
}
