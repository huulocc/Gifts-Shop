import { Router } from 'express';
import { controllers } from '../container';
import { requireAuth } from '../middleware/auth';

export function authRoutes(): Router {
  const router = Router();

  router.post('/register', controllers.auth.register);
  router.post('/login', controllers.auth.login);
  router.post('/logout', controllers.auth.logout);
  router.get('/me', requireAuth, controllers.auth.me);
  router.post('/change-password', requireAuth, controllers.auth.changePassword);

  return router;
}
