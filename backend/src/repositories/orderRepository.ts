import { OrderStatus, Prisma, PrismaClient } from '@prisma/client';
import type { OrderDto, OrderStatusDto, PaymentMethodDto } from '../types/domain';
import { apiOrderStatusToPrisma, apiPaymentMethodToPrisma, orderStatusToApi, paymentMethodToApi, paymentStatusToApi, roleToApi } from '../utils/enums';
import { ApiError, conflict } from '../utils/apiError';
import { moneyToString, multiplyMoney } from '../utils/money';

export interface OrderListFilters {
  status?: OrderStatusDto;
  query?: string;
}

export interface RevenueSource {
  revenueRows: OrderDto[];
  excluded: {
    pending: number;
    placed: number;
    cancelled: number;
  };
}

export interface PendingOrderItem {
  cartItemId: string;
  productId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
}

export interface CreatePendingOrderData {
  giftMessage: string | null;
  paymentMethod: PaymentMethodDto;
  totalAmount: Prisma.Decimal;
  items: PendingOrderItem[];
}

export interface OrderRepository {
  createPendingOrder(customerId: string, data: CreatePendingOrderData): Promise<OrderDto>;
  findAllOrders(filters: OrderListFilters): Promise<OrderDto[]>;
  findOrdersByCustomer(customerId: string): Promise<OrderDto[]>;
  findOrderById(orderId: string): Promise<OrderDto | null>;
  saveOrderStatus(orderId: string, nextStatus: OrderStatusDto): Promise<OrderDto>;
  findOrdersForRevenueReport(): Promise<RevenueSource>;
}

const orderInclude = {
  customer: true,
  items: {
    include: {
      product: true,
    },
  },
  payments: true,
} satisfies Prisma.OrderInclude;

type OrderWithDetails = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function mapOrder(row: OrderWithDetails): OrderDto {
  return {
    id: row.id,
    customer: {
      id: row.customer.id,
      fullName: row.customer.fullName,
      phoneNumber: row.customer.phoneNumber,
      email: row.customer.email,
      role: roleToApi(row.customer.role),
    },
    giftMessage: row.giftMessage,
    orderStatus: orderStatusToApi(row.orderStatus),
    paymentMethod: paymentMethodToApi(row.paymentMethod),
    totalAmount: moneyToString(row.totalAmount),
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: moneyToString(item.unitPrice),
      lineTotal: multiplyMoney(item.unitPrice, item.quantity),
    })),
    payments: row.payments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      paymentMethod: paymentMethodToApi(payment.paymentMethod) ?? 'cash',
      paymentDate: payment.paymentDate.toISOString(),
      amount: moneyToString(payment.amount),
      status: paymentStatusToApi(payment.status),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly db: PrismaClient) {}

  async createPendingOrder(customerId: string, data: CreatePendingOrderData): Promise<OrderDto> {
    return this.db.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: {
          id: { in: data.items.map((item) => item.cartItemId) },
          cart: { userId: customerId },
        },
      });

      const cartMatches = cartItems.length === data.items.length && data.items.every((item) =>
        cartItems.some((row) =>
          row.id === item.cartItemId &&
          row.productId === item.productId &&
          row.quantity === item.quantity,
        ),
      );
      if (!cartMatches) {
        throw conflict('Cart changed while the order was being created. Please review it and try again.');
      }

      for (const item of data.items) {
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            quantity: { gte: item.quantity },
          },
          data: { quantity: { decrement: item.quantity } },
        });
        if (stockUpdate.count !== 1) {
          throw new ApiError(
            409,
            'STOCK_CONFLICT',
            `Stock is no longer available for product ${item.productId}`,
          );
        }
      }

      const order = await tx.order.create({
        data: {
          customerId,
          giftMessage: data.giftMessage,
          paymentMethod: apiPaymentMethodToPrisma(data.paymentMethod),
          totalAmount: data.totalAmount,
          orderStatus: OrderStatus.PENDING,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: orderInclude,
      });

      const deleted = await tx.cartItem.deleteMany({
        where: {
          id: { in: data.items.map((item) => item.cartItemId) },
          cart: { userId: customerId },
        },
      });
      if (deleted.count !== data.items.length) {
        throw conflict('Cart changed while the order was being created. Please try again.');
      }

      return mapOrder(order);
    });
  }

  async findAllOrders(filters: OrderListFilters): Promise<OrderDto[]> {
    const where: Prisma.OrderWhereInput = {};

    if (filters.status) {
      where.orderStatus = apiOrderStatusToPrisma(filters.status);
    }

    if (filters.query) {
      where.OR = [
        { id: { contains: filters.query, mode: 'insensitive' } },
        { customer: { fullName: { contains: filters.query, mode: 'insensitive' } } },
        { customer: { email: { contains: filters.query, mode: 'insensitive' } } },
      ];
    }

    const rows = await this.db.order.findMany({
      where,
      include: orderInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });

    return rows.map(mapOrder);
  }

  async findOrdersByCustomer(customerId: string): Promise<OrderDto[]> {
    const rows = await this.db.order.findMany({
      where: { customerId },
      include: orderInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(mapOrder);
  }

  async findOrderById(orderId: string): Promise<OrderDto | null> {
    const row = await this.db.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    return row ? mapOrder(row) : null;
  }

  async saveOrderStatus(orderId: string, nextStatus: OrderStatusDto): Promise<OrderDto> {
    const row = await this.db.order.update({
      where: { id: orderId },
      data: { orderStatus: apiOrderStatusToPrisma(nextStatus) },
      include: orderInclude,
    });
    return mapOrder(row);
  }

  async findOrdersForRevenueReport(): Promise<RevenueSource> {
    const [revenueRows, pending, placed, cancelled] = await this.db.$transaction([
      this.db.order.findMany({
        where: { orderStatus: { in: [OrderStatus.PAID, OrderStatus.COMPLETED] } },
        include: orderInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.db.order.count({ where: { orderStatus: OrderStatus.PENDING } }),
      this.db.order.count({ where: { orderStatus: OrderStatus.PLACED } }),
      this.db.order.count({ where: { orderStatus: OrderStatus.CANCELLED } }),
    ]);

    return {
      revenueRows: revenueRows.map(mapOrder),
      excluded: { pending, placed, cancelled },
    };
  }
}
