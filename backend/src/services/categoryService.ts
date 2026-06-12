import type { CategoryRepository } from '../repositories/categoryRepository';
import { notImplemented } from '../utils/apiError';

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async listCategories(): Promise<never> {
    void this.categoryRepository;
    throw notImplemented('Category listing');
  }

  async createCategory(): Promise<never> {
    throw notImplemented('Category creation');
  }

  async updateCategory(): Promise<never> {
    throw notImplemented('Category update');
  }

  async softDisableCategory(): Promise<never> {
    throw notImplemented('Category soft-disable');
  }
}
