import {
  OrderStatus,
  PaymentStatus,
  type Payment,
  type PaymentMethod,
  type PrismaClient,
} from '@prisma/client';
import { conflict } from '../utils/apiError';

export interface PaymentRepository {
  completePaymentAndPlaceOrder(
    orderId: string,
    paymentMethod: PaymentMethod,
    amount: string,
  ): Promise<Payment>;
  findPaymentsByOrderId(orderId: string): Promise<Payment[]>;
}

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly db: PrismaClient) {}

  async completePaymentAndPlaceOrder(
    orderId: string,
    paymentMethod: PaymentMethod,
    amount: string,
  ): Promise<Payment> {
    return this.db.$transaction(async (tx) => {
      const statusUpdate = await tx.order.updateMany({
        where: { id: orderId, orderStatus: OrderStatus.PENDING },
        data: { orderStatus: OrderStatus.PLACED },
      });
      if (statusUpdate.count !== 1) {
        throw conflict('Order status must be pending before placing');
      }

      return tx.payment.create({
        data: {
          orderId,
          paymentMethod,
          amount,
          status: PaymentStatus.COMPLETED,
        },
      });
    });
  }

  async findPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return this.db.payment.findMany({
      where: { orderId },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
