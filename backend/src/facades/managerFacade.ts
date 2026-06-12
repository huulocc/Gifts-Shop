import type { OrderRepository, OrderListFilters } from '../repositories/orderRepository';
import type { OrderStatusDto } from '../types/domain';
import { notImplemented } from '../utils/apiError';

export class ManagerFacade {
  constructor(private readonly orderRepository: OrderRepository) {}

  async listAllOrders(_filters: OrderListFilters): Promise<never> {
    void this.orderRepository;
    throw notImplemented('Manager order listing');
  }

  async updateOrderStatus(_orderId: string, _nextStatus: OrderStatusDto): Promise<never> {
    throw notImplemented('Manager order status update');
  }

  async getRevenueSummary(): Promise<never> {
    throw notImplemented('Manager revenue summary');
  }
}
