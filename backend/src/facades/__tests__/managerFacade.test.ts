import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CreatePendingOrderData,
  OrderListFilters,
  OrderRepository,
  RevenueSource,
} from '../../repositories/orderRepository';
import type { OrderDto, OrderStatusDto } from '../../types/domain';
import { isApiError } from '../../utils/apiError';
import { ManagerFacade } from '../managerFacade';

class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, OrderDto>();

  async createPendingOrder(customerId: string, data: CreatePendingOrderData): Promise<OrderDto> {
    const order = makeOrder({
      id: `order-${this.orders.size + 1}`,
      customer: {
        id: customerId,
        fullName: 'Customer One',
        phoneNumber: null,
        email: 'customer@example.com',
        role: 'customer',
      },
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      shippingAddress: data.shippingAddress,
      voucher: null,
      giftMessage: data.giftMessage,
      orderStatus: 'pending',
      paymentMethod: data.paymentMethod,
      subtotalAmount: data.totalAmount.plus(data.discountAmount).toFixed(2),
      discountAmount: data.discountAmount.toFixed(2),
      totalAmount: data.totalAmount.toFixed(2),
      items: data.items.map((item) => ({
        id: item.cartItemId,
        productId: item.productId,
        productName: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        lineTotal: item.unitPrice.mul(item.quantity).toFixed(2),
      })),
    });
    this.orders.set(order.id, order);
    return this.clone(order);
  }

  async findAllOrders(filters: OrderListFilters): Promise<OrderDto[]> {
    const query = filters.query?.toLowerCase().trim();
    return [...this.orders.values()].filter((order) => {
      if (filters.status && order.orderStatus !== filters.status) return false;
      if (!query) return true;
      return `${order.id} ${order.customer?.fullName || ''} ${order.customer?.email || ''}`
        .toLowerCase()
        .includes(query);
    });
  }

  async findOrdersByCustomer(customerId: string): Promise<OrderDto[]> {
    return this.clone(
      [...this.orders.values()].filter((order) => order.customer?.id === customerId),
    );
  }

  async findOrderById(orderId: string): Promise<OrderDto | null> {
    return this.clone(this.orders.get(orderId) ?? null);
  }

  async saveOrderStatus(orderId: string, nextStatus: OrderStatusDto): Promise<OrderDto> {
    const current = this.orders.get(orderId);
    if (!current) throw new Error(`No order ${orderId}`);
    const updated = { ...current, orderStatus: nextStatus, updatedAt: '2026-01-02T00:00:00.000Z' };
    this.orders.set(orderId, updated);
    return this.clone(updated);
  }

  async findOrdersForRevenueReport(): Promise<RevenueSource> {
    const orders = [...this.orders.values()];
    return {
      revenueRows: this.clone(
        orders.filter((order) => order.orderStatus === 'paid' || order.orderStatus === 'completed'),
      ),
      excluded: {
        pending: orders.filter((order) => order.orderStatus === 'pending').length,
        placed: orders.filter((order) => order.orderStatus === 'placed').length,
        cancelled: orders.filter((order) => order.orderStatus === 'cancelled').length,
      },
    };
  }

  seed(overrides: Partial<OrderDto> = {}): OrderDto {
    const order = makeOrder(overrides);
    this.orders.set(order.id, order);
    return this.clone(order);
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}

function makeOrder(overrides: Partial<OrderDto> = {}): OrderDto {
  return {
    id: overrides.id ?? 'order-1',
    customer: overrides.customer ?? {
      id: 'customer-1',
      fullName: 'Customer One',
      phoneNumber: null,
      email: 'customer@example.com',
      role: 'customer',
    },
    recipientName: overrides.recipientName ?? 'Recipient One',
    recipientPhone: overrides.recipientPhone ?? '0912345678',
    shippingAddress: overrides.shippingAddress ?? {
      state: 'Ho Chi Minh',
      city: 'Thu Duc',
      street: 'Vo Van Ngan',
      buildingNumber: '12A',
    },
    voucher: overrides.voucher ?? null,
    giftMessage: overrides.giftMessage ?? null,
    orderStatus: overrides.orderStatus ?? 'placed',
    paymentMethod: overrides.paymentMethod ?? 'cash',
    subtotalAmount: overrides.subtotalAmount ?? overrides.totalAmount ?? '25.00',
    discountAmount: overrides.discountAmount ?? '0.00',
    totalAmount: overrides.totalAmount ?? '25.00',
    items: overrides.items ?? [],
    payments: overrides.payments ?? [],
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
  };
}

describe('ManagerFacade', () => {
  let repository: InMemoryOrderRepository;
  let facade: ManagerFacade;

  beforeEach(() => {
    repository = new InMemoryOrderRepository();
    facade = new ManagerFacade(repository);
  });

  it('lists all manager orders with status and query filters', async () => {
    repository.seed({ id: 'order-paid', orderStatus: 'paid' });
    repository.seed({
      id: 'order-cancelled',
      orderStatus: 'cancelled',
      customer: {
        id: 'customer-2',
        fullName: 'Other Customer',
        phoneNumber: null,
        email: 'other@example.com',
        role: 'customer',
      },
    });

    await expect(facade.listAllOrders({ status: 'paid', query: 'customer@example.com' })).resolves.toMatchObject([
      { id: 'order-paid', orderStatus: 'paid' },
    ]);
  });

  it('updates status when the transition is valid', async () => {
    repository.seed({ id: 'order-1', orderStatus: 'paid' });

    await expect(facade.updateOrderStatus('order-1', 'completed')).resolves.toMatchObject({
      id: 'order-1',
      orderStatus: 'completed',
    });
  });

  it('returns not found when updating a missing order', async () => {
    await expect(facade.updateOrderStatus('missing-order', 'completed')).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.statusCode === 404,
    );
  });

  it('rejects invalid backend status transitions', async () => {
    repository.seed({ id: 'order-1', orderStatus: 'completed' });

    await expect(facade.updateOrderStatus('order-1', 'paid')).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.statusCode === 409,
    );
  });

  it('builds revenue summary from paid and completed orders only', async () => {
    repository.seed({ id: 'paid-order', orderStatus: 'paid', totalAmount: '125.50' });
    repository.seed({ id: 'completed-order', orderStatus: 'completed', totalAmount: '74.50' });
    repository.seed({ id: 'pending-order', orderStatus: 'pending', totalAmount: '999.00' });
    repository.seed({ id: 'placed-order', orderStatus: 'placed', totalAmount: '999.00' });
    repository.seed({ id: 'cancelled-order', orderStatus: 'cancelled', totalAmount: '999.00' });

    await expect(facade.getRevenueSummary()).resolves.toMatchObject({
      totalRevenue: '200.00',
      countedOrderCount: 2,
      paidRevenue: '125.50',
      completedRevenue: '74.50',
      excluded: {
        pending: 1,
        placed: 1,
        cancelled: 1,
      },
      countedOrders: [
        { id: 'paid-order', orderStatus: 'paid' },
        { id: 'completed-order', orderStatus: 'completed' },
      ],
    });
  });

  it('returns an empty revenue summary when there are no paid or completed orders', async () => {
    repository.seed({ id: 'pending-order', orderStatus: 'pending', totalAmount: '50.00' });
    repository.seed({ id: 'cancelled-order', orderStatus: 'cancelled', totalAmount: '75.00' });

    await expect(facade.getRevenueSummary()).resolves.toMatchObject({
      totalRevenue: '0.00',
      countedOrderCount: 0,
      paidRevenue: '0.00',
      completedRevenue: '0.00',
      excluded: {
        pending: 1,
        placed: 0,
        cancelled: 1,
      },
      countedOrders: [],
    });
  });
});
