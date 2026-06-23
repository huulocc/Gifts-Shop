import type { PaymentRepository } from '../repositories/paymentRepository';
import type { PaymentDto, PaymentMethodDto } from '../types/domain';
import { apiPaymentMethodToPrisma, paymentMethodToApi, paymentStatusToApi } from '../utils/enums';
import { moneyToString } from '../utils/money';

function toDto(
  payment: Awaited<ReturnType<PaymentRepository['completePaymentAndPlaceOrder']>>,
): PaymentDto {
  return {
    id: payment.id,
    orderId: payment.orderId,
    paymentMethod: paymentMethodToApi(payment.paymentMethod)!,
    paymentDate: payment.paymentDate.toISOString(),
    amount: moneyToString(payment.amount),
    status: paymentStatusToApi(payment.status),
  };
}

export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async completePaymentAndPlaceOrder(
    orderId: string,
    paymentMethod: PaymentMethodDto,
    amount: string,
  ): Promise<PaymentDto> {
    const payment = await this.paymentRepository.completePaymentAndPlaceOrder(
      orderId,
      apiPaymentMethodToPrisma(paymentMethod),
      amount,
    );
    return toDto(payment);
  }

  async getOrderPayments(orderId: string): Promise<PaymentDto[]> {
    const payments = await this.paymentRepository.findPaymentsByOrderId(orderId);
    return payments.map(toDto);
  }
}
