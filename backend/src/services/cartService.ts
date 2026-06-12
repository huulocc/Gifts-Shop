import type { CartRepository } from '../repositories/cartRepository';
import { notImplemented } from '../utils/apiError';

export class CartService {
  constructor(private readonly cartRepository: CartRepository) {}

  async getCart(): Promise<never> {
    void this.cartRepository;
    throw notImplemented('Cart lookup');
  }

  async addItem(): Promise<never> {
    throw notImplemented('Cart item creation');
  }

  async updateItem(): Promise<never> {
    throw notImplemented('Cart item update');
  }

  async removeItem(): Promise<never> {
    throw notImplemented('Cart item removal');
  }

  async clearCart(): Promise<never> {
    throw notImplemented('Cart clearing');
  }
}
