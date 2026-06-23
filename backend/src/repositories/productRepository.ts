import type { Prisma, PrismaClient, Product } from '@prisma/client';

export interface ProductListFilters {
  includeInactive?: boolean;
  includeInactiveCategories?: boolean;
  search?: string;
  categoryId?: string;
}

export interface ProductWriteData {
  name: string;
  categoryId: string;
  description: string | null;
  unitPrice: string;
  imageUrl: string | null;
  isActive: boolean;
  quantity: number;
}

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

export interface ProductRepository {
  readonly db: PrismaClient;
  findProductById(productId: string): Promise<Product | null>;
  findProductsByIds(productIds: string[]): Promise<ProductWithCategory[]>;
  findAll(filters?: ProductListFilters): Promise<ProductWithCategory[]>;
  findById(id: string, options?: { includeInactive?: boolean }): Promise<ProductWithCategory | null>;
  findByName(name: string): Promise<Product | null>;
  findByNameExceptId(name: string, excludedId: string): Promise<Product | null>;
  create(data: ProductWriteData): Promise<ProductWithCategory>;
  update(id: string, data: ProductWriteData): Promise<ProductWithCategory>;
  updateStock(id: string, quantity: number): Promise<ProductWithCategory>;
  softDisable(id: string): Promise<ProductWithCategory>;
  countActiveByCategoryId(categoryId: string): Promise<number>;
}

export class PrismaProductRepository implements ProductRepository {
  constructor(public readonly db: PrismaClient) {}

  async findProductById(productId: string): Promise<Product | null> {
    return this.db.product.findFirst({
      where: { id: productId, isActive: true },
    });
  }

  async findProductsByIds(productIds: string[]): Promise<ProductWithCategory[]> {
    return this.db.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });
  }

  findAll(filters: ProductListFilters = {}): Promise<ProductWithCategory[]> {
    const search = filters.search?.trim();

    return this.db.product.findMany({
      where: {
        ...(filters.includeInactive ? {} : { isActive: true }),
        ...(filters.includeInactiveCategories ? {} : { category: { isActive: true } }),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
    });
  }

  findById(
    id: string,
    options: { includeInactive?: boolean } = {},
  ): Promise<ProductWithCategory | null> {
    return this.db.product.findFirst({
      where: {
        id,
        ...(options.includeInactive ? {} : { isActive: true, category: { isActive: true } }),
      },
      include: { category: true },
    });
  }

  findByName(name: string): Promise<Product | null> {
    return this.db.product.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  findByNameExceptId(name: string, excludedId: string): Promise<Product | null> {
    return this.db.product.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        NOT: { id: excludedId },
      },
    });
  }

  create(data: ProductWriteData): Promise<ProductWithCategory> {
    return this.db.product.create({
      data,
      include: { category: true },
    });
  }

  update(id: string, data: ProductWriteData): Promise<ProductWithCategory> {
    return this.db.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  updateStock(id: string, quantity: number): Promise<ProductWithCategory> {
    return this.db.product.update({
      where: { id },
      data: { quantity },
      include: { category: true },
    });
  }

  softDisable(id: string): Promise<ProductWithCategory> {
    return this.db.product.update({
      where: { id },
      data: { isActive: false },
      include: { category: true },
    });
  }

  countActiveByCategoryId(categoryId: string): Promise<number> {
    return this.db.product.count({
      where: {
        categoryId,
        isActive: true,
      },
    });
  }
}
