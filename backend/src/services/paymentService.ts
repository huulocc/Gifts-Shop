import type { PaymentRepository } from '../repositories/paymentRepository';
import { notImplemented } from '../utils/apiError';

export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async recordPayment(): Promise<never> {
    void this.paymentRepository;
    throw notImplemented('Payment recording');
  }

  async getOrderPayments(): Promise<never> {
    throw notImplemented('Order payment lookup');
  }
}
