import bcrypt from 'bcryptjs';
import { Role, type User } from '@prisma/client';
import type { UserRepository } from '../repositories/userRepository';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from '../schemas/authSchemas';
import type { AuthenticatedUser } from '../types/api';
import type { UserDto } from '../types/domain';
import { signSessionToken } from '../middleware/auth';
import { conflict, unauthenticated } from '../utils/apiError';
import { roleToApi } from '../utils/enums';

const SALT_ROUNDS = 10;

export interface AuthResult {
  user: UserDto;
  token: string;
}

function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    email: user.email,
    role: roleToApi(user.role),
  };
}

function toAuthenticatedUser(user: User): AuthenticatedUser {
  return { id: user.id, email: user.email, role: roleToApi(user.role) };
}

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw conflict('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      fullName: input.fullName,
      phoneNumber: input.phoneNumber ?? null,
      email: input.email,
      passwordHash,
      role: Role.CUSTOMER,
    });

    return { user: toUserDto(user), token: signSessionToken(toAuthenticatedUser(user)) };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(input.email);
    const passwordMatches = user
      ? await bcrypt.compare(input.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw unauthenticated('Invalid email or password.');
    }

    return { user: toUserDto(user), token: signSessionToken(toAuthenticatedUser(user)) };
  }

  async logout(): Promise<{ message: string }> {
    return { message: 'Logged out.' };
  }

  async getCurrentUser(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw unauthenticated('Your account could not be found.');
    }
    return toUserDto(user);
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw unauthenticated('Your account could not be found.');
    }

    const currentMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!currentMatches) {
      throw unauthenticated('The current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await this.userRepository.updatePassword(user.id, passwordHash);

    return { message: 'Password updated.' };
  }
}
