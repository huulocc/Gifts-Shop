import type { PrismaClient } from '@prisma/client';

export interface UserRepository {
  findByEmail(email: string): Promise<unknown>;
  findById(id: string): Promise<unknown>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<unknown> {
    return this.db.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<unknown> {
    return this.db.user.findUnique({ where: { id } });
  }
}
