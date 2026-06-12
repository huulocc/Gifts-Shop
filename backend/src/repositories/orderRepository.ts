import { OrderStatus, Prisma, PrismaClient } from '@prisma/client';
import type { OrderDto, OrderStatusDto } from '../types/domain';
import { apiOrderStatusToPrisma, orderStatusToApi, paymentMethodToApi, paymentStatusToApi, roleToApi } from '../utils/enums';
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

export interface OrderRepository {
  findAllOrders(filters: OrderListFilters): Promise<OrderDto[]>;
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
