import { Router } from 'express';
import { controllers } from '../container';

export function categoryRoutes(): Router {
  const router = Router();

  router.get('/', controllers.categories.listCategories);

  return router;
}
