import { notImplemented } from '../utils/apiError';

export class OrderFacade {
  async placeOrderFromCart(): Promise<never> {
    throw notImplemented('Order placement from cart');
  }

  async recordPayment(): Promise<never> {
    throw notImplemented('Order payment workflow');
  }
}
