import type { PrismaClient } from '@prisma/client';

export interface CartRepository {
  readonly db: PrismaClient;
}

export class PrismaCartRepository implements CartRepository {
  constructor(public readonly db: PrismaClient) {}
}
