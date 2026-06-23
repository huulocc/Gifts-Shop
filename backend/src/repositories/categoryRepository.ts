import type { Category, PrismaClient } from '@prisma/client';

export interface CategoryListFilters {
  includeInactive?: boolean;
  search?: string;
}

export interface CategoryWriteData {
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface CategoryRepository {
  readonly db: PrismaClient;
  findAll(filters?: CategoryListFilters): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findByNameExceptId(name: string, excludedId: string): Promise<Category | null>;
  create(data: CategoryWriteData): Promise<Category>;
  update(id: string, data: CategoryWriteData): Promise<Category>;
  softDisable(id: string): Promise<Category>;
}

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(public readonly db: PrismaClient) {}

  findAll(filters: CategoryListFilters = {}): Promise<Category[]> {
    const search = filters.search?.trim();

    return this.db.category.findMany({
      where: {
        ...(filters.includeInactive ? {} : { isActive: true }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string): Promise<Category | null> {
    return this.db.category.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Category | null> {
    return this.db.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  findByNameExceptId(name: string, excludedId: string): Promise<Category | null> {
    return this.db.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        NOT: { id: excludedId },
      },
    });
  }

  create(data: CategoryWriteData): Promise<Category> {
    return this.db.category.create({ data });
  }

  update(id: string, data: CategoryWriteData): Promise<Category> {
    return this.db.category.update({ where: { id }, data });
  }

  softDisable(id: string): Promise<Category> {
    return this.db.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
