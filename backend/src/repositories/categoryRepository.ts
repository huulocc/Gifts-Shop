import type { PrismaClient } from '@prisma/client';

export interface CategoryRepository {
  readonly db: PrismaClient;
}

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(public readonly db: PrismaClient) {}
}
