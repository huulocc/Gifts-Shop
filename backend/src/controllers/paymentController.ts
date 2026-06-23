import { PaymentService } from '../services/paymentService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  getOrderPayments = asyncHandler(async (req, res) => {
    sendData(res, await this.paymentService.getOrderPayments(String(req.query.orderId ?? '')));
  });
}
