import type { Category, PrismaClient, Product } from '@prisma/client';

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

export type ProductWithCategory = Product & {
  category: Pick<Category, 'id' | 'name' | 'isActive'>;
};

export interface ProductRepository {
  readonly db: PrismaClient;
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
      include: {
        category: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
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
      include: {
        category: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
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
      include: {
        category: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
  }

  update(id: string, data: ProductWriteData): Promise<ProductWithCategory> {
    return this.db.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
  }

  updateStock(id: string, quantity: number): Promise<ProductWithCategory> {
    return this.db.product.update({
      where: { id },
      data: { quantity },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
  }

  softDisable(id: string): Promise<ProductWithCategory> {
    return this.db.product.update({
      where: { id },
      data: { isActive: false },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
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
