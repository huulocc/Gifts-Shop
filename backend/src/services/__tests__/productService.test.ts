import { Prisma, type Category, type Product, type PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import type { CategoryRepository, CategoryWriteData } from '../../repositories/categoryRepository';
import type {
  ProductListFilters,
  ProductRepository,
  ProductWithCategory,
  ProductWriteData,
} from '../../repositories/productRepository';
import { isApiError } from '../../utils/apiError';
import { ProductService } from '../productService';

class InMemoryCategoryRepository implements CategoryRepository {
  readonly db = {} as PrismaClient;
  private readonly categories = new Map<string, Category>();

  async findAll(): Promise<Category[]> {
    return [...this.categories.values()].map((category) => ({ ...category }));
  }

  async findById(id: string): Promise<Category | null> {
    const category = this.categories.get(id);
    return category ? { ...category } : null;
  }

  async findByName(name: string): Promise<Category | null> {
    for (const category of this.categories.values()) {
      if (category.name.toLowerCase() === name.toLowerCase()) return { ...category };
    }
    return null;
  }

  async findByNameExceptId(name: string, excludedId: string): Promise<Category | null> {
    for (const category of this.categories.values()) {
      if (category.id !== excludedId && category.name.toLowerCase() === name.toLowerCase()) {
        return { ...category };
      }
    }
    return null;
  }

  async create(data: CategoryWriteData): Promise<Category> {
    const category = this.buildCategory(`category-${this.categories.size + 1}`, data);
    this.categories.set(category.id, category);
    return { ...category };
  }

  async update(id: string, data: CategoryWriteData): Promise<Category> {
    const current = this.categories.get(id);
    if (!current) throw new Error(`No category ${id}`);
    const updated = { ...current, ...data };
    this.categories.set(id, updated);
    return { ...updated };
  }

  async softDisable(id: string): Promise<Category> {
    const current = this.categories.get(id);
    if (!current) throw new Error(`No category ${id}`);
    const updated = { ...current, isActive: false };
    this.categories.set(id, updated);
    return { ...updated };
  }

  seed(overrides: Partial<Category> = {}): Category {
    const category = this.buildCategory(overrides.id ?? `category-${this.categories.size + 1}`, {
      name: overrides.name ?? 'Gifts',
      description: overrides.description ?? null,
      isActive: overrides.isActive ?? true,
    });
    this.categories.set(category.id, category);
    return { ...category };
  }

  private buildCategory(id: string, data: CategoryWriteData): Category {
    const now = new Date('2026-01-01T00:00:00.000Z');
    return {
      id,
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      createdAt: now,
      updatedAt: now,
    };
  }
}

class InMemoryProductRepository implements ProductRepository {
  readonly db = {} as PrismaClient;
  private readonly products = new Map<string, Product>();
  private sequence = 0;

  constructor(private readonly categoryRepository: InMemoryCategoryRepository) {}

  async findProductById(productId: string): Promise<Product | null> {
    const product = this.products.get(productId);
    if (!product || !product.isActive) return null;
    return { ...product };
  }

  async findProductsByIds(productIds: string[]): Promise<ProductWithCategory[]> {
    return Promise.all(
      [...this.products.values()]
        .filter((product) => productIds.includes(product.id))
        .map((product) => this.withCategory(product)),
    );
  }

  async findAll(filters: ProductListFilters = {}): Promise<ProductWithCategory[]> {
    const search = filters.search?.toLowerCase().trim();
    const products = [...this.products.values()].filter((product) => {
      const category = this.categoryRepository.findById(product.categoryId);
      void category;
      if (!filters.includeInactive && !product.isActive) return false;
      if (filters.categoryId && product.categoryId !== filters.categoryId) return false;
      if (!search) return true;
      return product.name.toLowerCase().includes(search);
    });
    return Promise.all(products.map((product) => this.withCategory(product)));
  }

  async findById(
    id: string,
    options: { includeInactive?: boolean } = {},
  ): Promise<ProductWithCategory | null> {
    const product = this.products.get(id);
    if (!product || (!options.includeInactive && !product.isActive)) return null;
    return this.withCategory(product);
  }

  async findByName(name: string): Promise<Product | null> {
    for (const product of this.products.values()) {
      if (product.name.toLowerCase() === name.toLowerCase()) return { ...product };
    }
    return null;
  }

  async findByNameExceptId(name: string, excludedId: string): Promise<Product | null> {
    for (const product of this.products.values()) {
      if (product.id !== excludedId && product.name.toLowerCase() === name.toLowerCase()) {
        return { ...product };
      }
    }
    return null;
  }

  async create(data: ProductWriteData): Promise<ProductWithCategory> {
    this.sequence += 1;
    const product = this.buildProduct(`product-${this.sequence}`, data);
    this.products.set(product.id, product);
    return this.withCategory(product);
  }

  async update(id: string, data: ProductWriteData): Promise<ProductWithCategory> {
    const current = this.products.get(id);
    if (!current) throw new Error(`No product ${id}`);
    const updated = this.buildProduct(id, data, current.createdAt);
    this.products.set(id, updated);
    return this.withCategory(updated);
  }

  async updateStock(id: string, quantity: number): Promise<ProductWithCategory> {
    const current = this.products.get(id);
    if (!current) throw new Error(`No product ${id}`);
    const updated = { ...current, quantity };
    this.products.set(id, updated);
    return this.withCategory(updated);
  }

  async softDisable(id: string): Promise<ProductWithCategory> {
    const current = this.products.get(id);
    if (!current) throw new Error(`No product ${id}`);
    const updated = { ...current, isActive: false };
    this.products.set(id, updated);
    return this.withCategory(updated);
  }

  async countActiveByCategoryId(categoryId: string): Promise<number> {
    return [...this.products.values()].filter(
      (product) => product.categoryId === categoryId && product.isActive,
    ).length;
  }

  async seed(data: ProductWriteData): Promise<ProductWithCategory> {
    return this.create(data);
  }

  private buildProduct(id: string, data: ProductWriteData, createdAt?: Date): Product {
    const now = new Date('2026-01-01T00:00:00.000Z');
    return {
      id,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      unitPrice: new Prisma.Decimal(data.unitPrice),
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      quantity: data.quantity,
      createdAt: createdAt ?? now,
      updatedAt: now,
    };
  }

  private async withCategory(product: Product): Promise<ProductWithCategory> {
    const category = await this.categoryRepository.findById(product.categoryId);
    if (!category) throw new Error(`No category ${product.categoryId}`);
    return {
      ...product,
      category,
    };
  }
}

const validInput = {
  name: 'Music box',
  categoryId: 'category-1',
  description: 'Wooden melody box',
  unitPrice: '19.99',
  imageUrl: 'https://example.com/music-box.jpg',
  isActive: true,
  quantity: 8,
};

describe('ProductService', () => {
  let categoryRepository: InMemoryCategoryRepository;
  let productRepository: InMemoryProductRepository;
  let service: ProductService;

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository();
    categoryRepository.seed({ id: 'category-1', name: 'Keepsakes' });
    productRepository = new InMemoryProductRepository(categoryRepository);
    service = new ProductService(productRepository, categoryRepository);
  });

  it('creates a product when the category exists and the name is unique', async () => {
    const product = await service.createProduct(validInput);

    expect(product).toMatchObject({
      name: 'Music box',
      categoryId: 'category-1',
      unitPrice: '19.99',
      isActive: true,
      quantity: 8,
      category: { id: 'category-1', name: 'Keepsakes' },
    });
  });

  it('rejects creation when the category does not exist', async () => {
    await expect(
      service.createProduct({ ...validInput, categoryId: 'missing-category' }),
    ).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.statusCode === 404,
    );
  });

  it('rejects duplicate product names', async () => {
    await service.createProduct(validInput);

    await expect(
      service.createProduct({ ...validInput, name: ' music box ' }),
    ).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.statusCode === 409,
    );
  });

  it('updates stock independently from product details', async () => {
    const product = await service.createProduct(validInput);

    const updated = await service.updateStock(product.id, 3);

    expect(updated.quantity).toBe(3);
    expect(updated.name).toBe('Music box');
  });

  it('soft-disables products without deleting the record', async () => {
    const product = await service.createProduct(validInput);

    const disabled = await service.softDisableProduct(product.id);

    expect(disabled.id).toBe(product.id);
    expect(disabled.isActive).toBe(false);
    await expect(service.getProduct(product.id, { includeInactive: true })).resolves.toMatchObject({
      id: product.id,
      isActive: false,
    });
  });
});
