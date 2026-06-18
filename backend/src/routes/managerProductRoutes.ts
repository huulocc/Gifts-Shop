import { Router } from 'express';
import { controllers } from '../container';
import { requireRole } from '../middleware/auth';

export function managerProductRoutes(): Router {
  const router = Router();

  router.use(requireRole('manager'));
  router.get('/', controllers.products.listManagerProducts);
  router.post('/', controllers.products.createProduct);
  router.put('/:id', controllers.products.updateProduct);
  router.patch('/:id/stock', controllers.products.updateStock);
  router.delete('/:id', controllers.products.softDisableProduct);

  return router;
}
