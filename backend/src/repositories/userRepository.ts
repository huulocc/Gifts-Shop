import type { PrismaClient, Role, User } from '@prisma/client';

export interface CreateUserInput {
  fullName: string;
  phoneNumber: string | null;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<User>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<User> {
    return this.db.user.create({ data: input });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.db.user.update({ where: { id }, data: { passwordHash } });
  }
}
