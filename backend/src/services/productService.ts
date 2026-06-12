import type { ProductRepository } from '../repositories/productRepository';
import { notImplemented } from '../utils/apiError';

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async listProducts(): Promise<never> {
    void this.productRepository;
    throw notImplemented('Product listing');
  }

  async getProduct(): Promise<never> {
    throw notImplemented('Product detail');
  }

  async createProduct(): Promise<never> {
    throw notImplemented('Product creation');
  }

  async updateProduct(): Promise<never> {
    throw notImplemented('Product update');
  }

  async updateStock(): Promise<never> {
    throw notImplemented('Product stock update');
  }

  async softDisableProduct(): Promise<never> {
    throw notImplemented('Product soft-disable');
  }
}
