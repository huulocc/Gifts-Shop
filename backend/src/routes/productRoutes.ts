import { Router } from 'express';
import { controllers } from '../container';

export function productRoutes(): Router {
  const router = Router();

  router.get('/', controllers.products.listProducts);
  router.get('/:id', controllers.products.getProduct);

  return router;
}
