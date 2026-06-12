import { Router } from 'express';
import { controllers } from '../container';
import { requireRole } from '../middleware/auth';

export function categoryRoutes(): Router {
  const router = Router();

  router.get('/', controllers.categories.listCategories);
  router.post('/', requireRole('manager'), controllers.categories.createCategory);
  router.put('/:id', requireRole('manager'), controllers.categories.updateCategory);
  router.delete('/:id', requireRole('manager'), controllers.categories.softDisableCategory);

  return router;
}
