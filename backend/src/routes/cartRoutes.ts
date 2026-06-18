import { Router } from 'express';
import { controllers } from '../container';
import { requireRole, verifyAddToCartToken } from '../middleware/auth';

export function cartRoutes(): Router {
  const router = Router();

  router.get('/', requireRole('customer'), controllers.cart.getCart);
  router.get('/view', requireRole('customer'), controllers.cart.getCart);
  router.get('/summary', requireRole('customer'), controllers.cart.getCartSummary);
  // Sequence Diagram - Step 1: POST /api/cart/add enters the Add To Cart flow.
  router.post('/add', verifyAddToCartToken, controllers.cart.addToCart);
  router.post('/items', verifyAddToCartToken, controllers.cart.addToCart);
  router.patch('/items/:itemId', requireRole('customer'), controllers.cart.updateItem);
  router.patch('/items/:itemId/increase', requireRole('customer'), controllers.cart.increaseItem);
  router.patch('/items/:itemId/decrease', requireRole('customer'), controllers.cart.decreaseItem);
  router.delete('/items/:itemId', requireRole('customer'), controllers.cart.removeItem);
  router.delete('/items', requireRole('customer'), controllers.cart.clearCart);
  router.delete('/', requireRole('customer'), controllers.cart.clearCart);

  return router;
}
