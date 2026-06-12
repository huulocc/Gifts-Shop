import type { PrismaClient } from '@prisma/client';

export interface ProductRepository {
  readonly db: PrismaClient;
}

export class PrismaProductRepository implements ProductRepository {
  constructor(public readonly db: PrismaClient) {}
}
