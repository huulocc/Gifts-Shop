import type { Prisma, PrismaClient, Product } from '@prisma/client';

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

export interface ProductRepository {
  findProductById(productId: string): Promise<Product | null>;
  findProductsByIds(productIds: string[]): Promise<ProductWithCategory[]>;
}

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly db: PrismaClient) {}

  // Sequence Diagram - Step 5: only return an active product.
  async findProductById(productId: string): Promise<Product | null> {
    return this.db.product.findFirst({
      where: { id: productId, isActive: true },
    });
  }

  // Manage Cart - load product details used to render active cart lines.
  async findProductsByIds(productIds: string[]): Promise<ProductWithCategory[]> {
    return this.db.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });
  }
}
