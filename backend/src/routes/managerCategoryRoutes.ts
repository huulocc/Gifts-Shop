import { Router } from 'express';
import { controllers } from '../container';
import { requireRole } from '../middleware/auth';

export function managerCategoryRoutes(): Router {
  const router = Router();

  router.use(requireRole('manager'));
  router.get('/', controllers.categories.listManagerCategories);
  router.post('/', controllers.categories.createCategory);
  router.put('/:id', controllers.categories.updateCategory);
  router.delete('/:id', controllers.categories.softDisableCategory);

  return router;
}
