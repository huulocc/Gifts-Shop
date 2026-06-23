import { CustomerFacade } from '../facades/customerFacade';
import { ManagerFacade } from '../facades/managerFacade';
import { OrderFacade } from '../facades/orderFacade';
import { assertCustomer, assertManager } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types/api';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';
import type { ManagerOrderListQuery, UpdateOrderStatusInput } from '../schemas/orderSchemas';

export class OrderController {
  constructor(
    private readonly customerFacade: CustomerFacade,
    private readonly managerFacade: ManagerFacade,
    private readonly orderFacade: OrderFacade,
  ) {}

  createOrder = asyncHandler(async (_req, res) => {
    sendData(res, await this.orderFacade.placeOrderFromCart(), 201);
  });

  listOrders = asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const query = req.query as ManagerOrderListQuery;

    if (query.scope === 'all') {
      assertManager(authReq);
      const orders = await this.managerFacade.listAllOrders({
        status: query.status,
        query: query.query,
      });
      sendData(res, orders);
      return;
    }

    assertCustomer(authReq);
    sendData(res, await this.customerFacade.listMyOrders());
  });

  getOrder = asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (req.query.scope === 'manager') {
      assertManager(authReq);
      sendData(res, await this.managerFacade.getOrder(req.params.id));
      return;
    }

    assertCustomer(authReq);
    sendData(res, await this.customerFacade.getMyOrder());
  });

  updateStatus = asyncHandler(async (req, res) => {
    assertManager(req as AuthenticatedRequest);
    const body = req.body as UpdateOrderStatusInput;
    const order = await this.managerFacade.updateOrderStatus(req.params.id, body.orderStatus);
    sendData(res, order);
  });
}
