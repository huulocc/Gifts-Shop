import { assertCustomer } from '../middleware/auth';
import { applyVoucherSchema } from '../schemas/orderSchemas';
import type { VoucherService } from '../services/voucherService';
import type { AuthenticatedRequest } from '../types/api';
import { sendData } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  applyVoucher = asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    assertCustomer(authReq);
    const body = applyVoucherSchema.parse(req.body);
    sendData(res, await this.voucherService.quoteCart(authReq.user!.id, body.voucherCode));
  });
}
