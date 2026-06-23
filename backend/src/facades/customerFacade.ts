import type { OrderRepository } from '../repositories/orderRepository';
import type { OrderDto } from '../types/domain';
import { ApiError, forbidden } from '../utils/apiError';

export class CustomerFacade {
  constructor(private readonly orderRepository: OrderRepository) {}

  async listMyOrders(customerId: string): Promise<OrderDto[]> {
    return this.orderRepository.findOrdersByCustomer(customerId);
  }

  async getMyOrder(customerId: string, orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    if (order.customer?.id !== customerId) {
      throw forbidden('You do not have permission to view this order');
    }
    return order;
  }
}
