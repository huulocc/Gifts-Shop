import type { UserRepository } from '../repositories/userRepository';
import { notImplemented } from '../utils/apiError';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(): Promise<never> {
    void this.userRepository;
    throw notImplemented('Customer registration');
  }

  async login(): Promise<never> {
    throw notImplemented('Login');
  }

  async logout(): Promise<{ message: string }> {
    return { message: 'Logged out.' };
  }

  async getCurrentUser(): Promise<never> {
    throw notImplemented('Current user lookup');
  }

  async changePassword(): Promise<never> {
    throw notImplemented('Password change');
  }
}
