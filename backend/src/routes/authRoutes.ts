import { Router } from 'express';
import { controllers } from '../container';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from '../schemas/authSchemas';

export function authRoutes(): Router {
  const router = Router();

  router.post('/register', validateBody(registerSchema), controllers.auth.register);
  router.post('/login', validateBody(loginSchema), controllers.auth.login);
  router.post('/logout', controllers.auth.logout);
  router.get('/me', requireAuth, controllers.auth.me);
  router.post(
    '/change-password',
    requireAuth,
    validateBody(changePasswordSchema),
    controllers.auth.changePassword,
  );

  return router;
}
