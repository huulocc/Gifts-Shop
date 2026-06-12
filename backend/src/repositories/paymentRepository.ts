import type { PrismaClient } from '@prisma/client';

export interface PaymentRepository {
  readonly db: PrismaClient;
}

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(public readonly db: PrismaClient) {}
}
