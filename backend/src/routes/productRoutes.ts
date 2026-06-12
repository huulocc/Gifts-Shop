import { Router } from 'express';
import { controllers } from '../container';
import { requireRole } from '../middleware/auth';

export function productRoutes(): Router {
  const router = Router();

  router.get('/', controllers.products.listProducts);
  router.get('/:id', controllers.products.getProduct);
  router.post('/', requireRole('manager'), controllers.products.createProduct);
  router.put('/:id', requireRole('manager'), controllers.products.updateProduct);
  router.patch('/:id/stock', requireRole('manager'), controllers.products.updateStock);
  router.delete('/:id', requireRole('manager'), controllers.products.softDisableProduct);

  return router;
}
