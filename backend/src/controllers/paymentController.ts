import { PaymentService } from '../services/paymentService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  recordPayment = asyncHandler(async (_req, res) => {
    sendData(res, await this.paymentService.recordPayment(), 201);
  });

  getOrderPayments = asyncHandler(async (_req, res) => {
    sendData(res, await this.paymentService.getOrderPayments());
  });
}
