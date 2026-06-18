import type { Category } from '@prisma/client';
import type { CategoryRepository } from '../repositories/categoryRepository';
import type { ProductRepository } from '../repositories/productRepository';
import type { CategoryDto } from '../types/domain';
import { badRequest, conflict, resourceNotFound } from '../utils/apiError';

export interface CategoryInput {
  name?: unknown;
  description?: unknown;
  isActive?: unknown;
}

export interface CategoryListInput {
  includeInactive?: boolean;
  search?: string;
}

interface NormalizedCategoryInput {
  name: string;
  description: string | null;
  isActive: boolean;
}

function toCategoryDto(category: Category): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
  };
}

function normalizeCategoryInput(
  input: CategoryInput,
  current?: Category,
): NormalizedCategoryInput {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    throw badRequest('Category name is required.', {
      name: 'Category name is required.',
    });
  }

  const description =
    typeof input.description === 'string' && input.description.trim()
      ? input.description.trim()
      : null;

  return {
    name,
    description,
    isActive:
      typeof input.isActive === 'boolean'
        ? input.isActive
        : current?.isActive ?? true,
  };
}

export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async listCategories(input: CategoryListInput = {}): Promise<CategoryDto[]> {
    const categories = await this.categoryRepository.findAll({
      includeInactive: Boolean(input.includeInactive),
      search: input.search,
    });
    return categories.map(toCategoryDto);
  }

  async createCategory(input: CategoryInput): Promise<CategoryDto> {
    const data = normalizeCategoryInput(input);
    const existing = await this.categoryRepository.findByName(data.name);
    if (existing) {
      throw conflict('Category name already exists.', {
        name: 'Category name already exists.',
      });
    }

    const category = await this.categoryRepository.create(data);
    return toCategoryDto(category);
  }

  async updateCategory(id: string, input: CategoryInput): Promise<CategoryDto> {
    const current = await this.categoryRepository.findById(id);
    if (!current) {
      throw resourceNotFound('Category not found.');
    }

    const data = normalizeCategoryInput(input, current);
    const existing = await this.categoryRepository.findByNameExceptId(data.name, id);
    if (existing) {
      throw conflict('Category name already exists.', {
        name: 'Category name already exists.',
      });
    }

    const category = await this.categoryRepository.update(id, data);
    return toCategoryDto(category);
  }

  async softDisableCategory(id: string): Promise<CategoryDto> {
    const current = await this.categoryRepository.findById(id);
    if (!current) {
      throw resourceNotFound('Category not found.');
    }

    const activeProductCount = await this.productRepository.countActiveByCategoryId(id);
    if (activeProductCount > 0) {
      throw conflict('Cannot delete category because active products still reference it.');
    }

    const category = await this.categoryRepository.softDisable(id);
    return toCategoryDto(category);
  }
}
