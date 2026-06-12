import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { cartRoutes } from './cartRoutes';
import { categoryRoutes } from './categoryRoutes';
import { orderRoutes } from './orderRoutes';
import { paymentRoutes } from './paymentRoutes';
import { productRoutes } from './productRoutes';
import { reportRoutes } from './reportRoutes';

export function apiRoutes(): Router {
  const router = Router();

  router.use('/auth', authRoutes());
  router.use('/products', productRoutes());
  router.use('/categories', categoryRoutes());
  router.use('/cart', cartRoutes());
  router.use('/orders', orderRoutes());
  router.use('/payments', paymentRoutes());
  router.use('/reports', reportRoutes());

  return router;
}
