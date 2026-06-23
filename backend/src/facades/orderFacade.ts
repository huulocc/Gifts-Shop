import { Prisma } from '@prisma/client';
import type { CartRepository } from '../repositories/cartRepository';
import type { OrderRepository, PendingOrderItem } from '../repositories/orderRepository';
import type { ProductRepository } from '../repositories/productRepository';
import type { PaymentService } from '../services/paymentService';
import type { OrderDto, OrderStatusDto, PaymentMethodDto } from '../types/domain';
import { ApiError, conflict, forbidden } from '../utils/apiError';

export interface CreateOrderRequest {
  giftMessage?: string | null;
  paymentMethod: PaymentMethodDto;
}

export interface OrderFacade {
  createOrder(customerId: string, request: CreateOrderRequest): Promise<OrderDto>;
  placeOrder(customerId: string, orderId: string): Promise<OrderDto>;
  updateOrderStatus(orderId: string, nextStatus: OrderStatusDto): Promise<OrderDto>;
}

export class DefaultOrderFacade implements OrderFacade {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
  ) {}

  async createOrder(customerId: string, request: CreateOrderRequest): Promise<OrderDto> {
    const cartItems = await this.cartRepository.findCartItemsByCustomer(customerId);
    if (cartItems.length === 0) {
      throw new ApiError(400, 'EMPTY_CART', 'Your cart is empty');
    }

    const products = await this.productRepository.findProductsByIds(
      cartItems.map((item) => item.productId),
    );
    const productsById = new Map(products.map((product) => [product.id, product]));

    let totalAmount = new Prisma.Decimal(0);
    const orderItems: PendingOrderItem[] = cartItems.map((cartItem) => {
      const product = productsById.get(cartItem.productId);
      if (!product || !product.isActive) {
        throw conflict(`Product ${cartItem.productId} is unavailable`);
      }
      if (product.quantity < cartItem.quantity) {
        throw new ApiError(
          409,
          'STOCK_CONFLICT',
          `Stock is no longer available for product ${cartItem.productId}`,
        );
      }

      totalAmount = totalAmount.plus(product.unitPrice.mul(cartItem.quantity));
      return {
        cartItemId: cartItem.id,
        productId: product.id,
        quantity: cartItem.quantity,
        unitPrice: product.unitPrice,
      };
    });

    return this.orderRepository.createPendingOrder(customerId, {
      giftMessage: request.giftMessage?.trim() || null,
      paymentMethod: request.paymentMethod,
      totalAmount,
      items: orderItems,
    });
  }

  async placeOrder(customerId: string, orderId: string): Promise<OrderDto> {
    const order = await this.getPendingOwnedOrder(customerId, orderId);
    if (!order.paymentMethod) {
      throw new ApiError(400, 'INVALID_PAYMENT_DATA', 'A payment method is required');
    }

    await this.paymentService.completePaymentAndPlaceOrder(
      order.id,
      order.paymentMethod,
      order.totalAmount,
    );
    const placedOrder = await this.orderRepository.findOrderById(order.id);
    if (!placedOrder) {
      throw new ApiError(500, 'ORDER_STATE_ERROR', 'Order could not be loaded after placement');
    }
    return placedOrder;
  }

  async updateOrderStatus(orderId: string, nextStatus: OrderStatusDto): Promise<OrderDto> {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');

    const allowedTransitions: Record<OrderStatusDto, OrderStatusDto[]> = {
      pending: ['placed', 'cancelled'],
      placed: ['paid', 'cancelled'],
      paid: ['completed', 'cancelled'],
      cancelled: [],
      completed: [],
    };
    if (!allowedTransitions[order.orderStatus].includes(nextStatus)) {
      throw conflict(`Cannot change order status from ${order.orderStatus} to ${nextStatus}`);
    }
    return this.orderRepository.saveOrderStatus(orderId, nextStatus);
  }

  private async getPendingOwnedOrder(customerId: string, orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    if (order.customer?.id !== customerId) {
      throw forbidden('You do not have permission to place this order');
    }
    if (order.orderStatus !== 'pending') {
      throw conflict('Order status must be pending before placing');
    }
    return order;
  }
}
