import { CustomerFacade } from '../facades/customerFacade';
import { ManagerFacade } from '../facades/managerFacade';
import type { CreateOrderRequest, OrderFacade } from '../facades/orderFacade';
import { assertCustomer, assertManager } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types/api';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';
import type { ManagerOrderListQuery, UpdateOrderStatusInput } from '../schemas/orderSchemas';
import { createOrderSchema } from '../schemas/orderSchemas';

export class OrderController {
  constructor(
    private readonly customerFacade: CustomerFacade,
    private readonly managerFacade: ManagerFacade,
    private readonly orderFacade: OrderFacade,
  ) {}

  createOrder = asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    assertCustomer(authReq);
    const validation = createOrderSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid order data',
          fields: Object.fromEntries(
            validation.error.issues.map((issue) => [issue.path.join('.') || 'request', issue.message]),
          ),
        },
      });
      return;
    }
    const request = validation.data as CreateOrderRequest;
    const order = await this.orderFacade.createOrder(authReq.user!.id, request);
    sendData(res, order, 201);
  });

  placeOrder = asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    assertCustomer(authReq);
    const order = await this.orderFacade.placeOrder(authReq.user!.id, req.params.id);
    sendData(res, order);
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
    sendData(res, await this.customerFacade.listMyOrders(authReq.user!.id));
  });

  getOrder = asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (req.query.scope === 'manager') {
      assertManager(authReq);
      sendData(res, await this.managerFacade.listAllOrders({ query: req.params.id }));
      return;
    }

    assertCustomer(authReq);
    sendData(res, await this.customerFacade.getMyOrder(authReq.user!.id, req.params.id));
  });

  updateStatus = asyncHandler(async (req, res) => {
    assertManager(req as AuthenticatedRequest);
    const body = req.body as UpdateOrderStatusInput;
    const order = await this.managerFacade.updateOrderStatus(req.params.id, body.orderStatus);
    sendData(res, order);
  });
}
