import type { PrismaClient, Voucher } from '@prisma/client';

export interface VoucherRepository {
  findActiveByCode(code: string): Promise<Voucher | null>;
}

export class PrismaVoucherRepository implements VoucherRepository {
  constructor(private readonly db: PrismaClient) {}

  findActiveByCode(code: string): Promise<Voucher | null> {
    return this.db.voucher.findFirst({
      where: {
        code,
        isActive: true,
      },
    });
  }
}
