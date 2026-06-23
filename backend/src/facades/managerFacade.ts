import type { OrderRepository, OrderListFilters } from '../repositories/orderRepository';
import type { OrderDto, OrderStatusDto, RevenueSummaryDto } from '../types/domain';
import { conflict, resourceNotFound } from '../utils/apiError';
import { moneyToString } from '../utils/money';

const allowedStatusTransitions: Record<OrderStatusDto, OrderStatusDto[]> = {
  pending: ['placed', 'paid', 'cancelled'],
  placed: ['paid', 'cancelled'],
  paid: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
};

export class ManagerFacade {
  constructor(private readonly orderRepository: OrderRepository) {}

  async listAllOrders(filters: OrderListFilters): Promise<OrderDto[]> {
    return this.orderRepository.findAllOrders(filters);
  }

  async getOrder(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) throw resourceNotFound('Order not found.');
    return order;
  }

  async updateOrderStatus(orderId: string, nextStatus: OrderStatusDto): Promise<OrderDto> {
    const order = await this.getOrder(orderId);
    if (order.orderStatus === nextStatus) return order;

    if (!allowedStatusTransitions[order.orderStatus].includes(nextStatus)) {
      throw conflict(`Cannot change order status from ${order.orderStatus} to ${nextStatus}.`, {
        orderStatus: 'Choose a valid next status for this order.',
      });
    }

    return this.orderRepository.saveOrderStatus(orderId, nextStatus);
  }

  async getRevenueSummary(): Promise<RevenueSummaryDto> {
    const { revenueRows, excluded } = await this.orderRepository.findOrdersForRevenueReport();
    const countedOrders = revenueRows.filter(
      (order) => order.orderStatus === 'paid' || order.orderStatus === 'completed',
    );

    const paidRevenue = countedOrders
      .filter((order) => order.orderStatus === 'paid')
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const completedRevenue = countedOrders
      .filter((order) => order.orderStatus === 'completed')
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);

    return {
      totalRevenue: moneyToString(paidRevenue + completedRevenue),
      countedOrderCount: countedOrders.length,
      paidRevenue: moneyToString(paidRevenue),
      completedRevenue: moneyToString(completedRevenue),
      excluded,
      countedOrders,
    };
  }
}
