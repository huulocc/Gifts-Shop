import { Router } from 'express';
import { controllers } from '../container';
import { requireRole } from '../middleware/auth';

export function cartRoutes(): Router {
  const router = Router();

  router.get('/', requireRole('customer'), controllers.cart.getCart);
  router.post('/items', requireRole('customer'), controllers.cart.addItem);
  router.patch('/items/:itemId', requireRole('customer'), controllers.cart.updateItem);
  router.delete('/items/:itemId', requireRole('customer'), controllers.cart.removeItem);
  router.delete('/items', requireRole('customer'), controllers.cart.clearCart);

  return router;
}
