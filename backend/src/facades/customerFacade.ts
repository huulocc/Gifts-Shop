import { notImplemented } from '../utils/apiError';

export class CustomerFacade {
  async listMyOrders(): Promise<never> {
    throw notImplemented('Customer order history');
  }

  async getMyOrder(): Promise<never> {
    throw notImplemented('Customer order detail');
  }

  async placeOrder(): Promise<never> {
    throw notImplemented('Checkout order placement');
  }
}
