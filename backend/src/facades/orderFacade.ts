import type { OrderDto, OrderStatusDto, PaymentDto, PaymentMethodDto } from '../types/domain';
import { notImplemented } from '../utils/apiError';

/**
 * A single line requested by the customer when placing an order.
 */
export interface PlaceOrderItemRequest {
  productId: string;
  quantity: number;
}

/**
 * Payload accepted by {@link OrderFacade.placeOrder}.
 *
 * `items` describes what the customer wants to buy. `giftMessage` and
 * `paymentMethod` are optional and may be supplied later during payment.
 */
export interface PlaceOrderRequest {
  items: PlaceOrderItemRequest[];
  giftMessage?: string | null;
  paymentMethod?: PaymentMethodDto | null;
}

/**
 * Payload accepted by {@link OrderFacade.recordPayment}.
 */
export interface RecordPaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethodDto;
  /** Amount as a decimal string (same convention as {@link PaymentDto.amount}). */
  amount: string;
}

/**
 * Facade contract for the ordering subsystem.
 *
 * This is the single entry point other layers (controllers, other facades such
 * as `CustomerFacade`) depend on to drive the order lifecycle. It hides the
 * coordination between the order, product, cart and payment repositories behind
 * three coarse-grained operations.
 *
 * Implementations are expected to:
 * - validate inputs and enforce business rules (stock, ownership, status flow);
 * - throw an {@link ApiError} (e.g. `notFound`, `conflict`, `forbidden`) on
 *   failure rather than returning error sentinels;
 * - keep each operation transactional so partial writes never leak.
 */
export interface OrderFacade {
  /**
   * Create a new order on behalf of a customer.
   *
   * @param customerId - Authenticated customer who owns the order.
   * @param request - Items to buy plus optional gift message / payment method.
   * @returns The newly created order, including its computed total and items.
   * @throws ApiError `NOT_FOUND` if a referenced product does not exist.
   * @throws ApiError `CONFLICT` if a product is inactive or out of stock.
   */
  placeOrder(customerId: string, request: PlaceOrderRequest): Promise<OrderDto>;

  /**
   * Record a payment against an existing order and advance it to `paid`.
   *
   * @param customerId - Authenticated customer who must own the target order.
   * @param request - Order id, chosen payment method and amount.
   * @returns The persisted payment record.
   * @throws ApiError `NOT_FOUND` if the order does not exist.
   * @throws ApiError `FORBIDDEN` if the order belongs to another customer.
   * @throws ApiError `CONFLICT` if the order is not in a payable state or the
   *         amount does not match the order total.
   */
  recordPayment(customerId: string, request: RecordPaymentRequest): Promise<PaymentDto>;

  /**
   * Transition an order to the next lifecycle status.
   *
   * Intended for manager-driven fulfilment (e.g. `paid` -> `completed`) and
   * cancellation. Implementations should reject illegal transitions.
   *
   * @param orderId - Order to update.
   * @param nextStatus - Desired status.
   * @returns The updated order.
   * @throws ApiError `NOT_FOUND` if the order does not exist.
   * @throws ApiError `CONFLICT` if the transition is not allowed.
   */
  updateOrderStatus(orderId: string, nextStatus: OrderStatusDto): Promise<OrderDto>;
}

/**
 * Default {@link OrderFacade} implementation.
 *
 * The behaviour is intentionally stubbed for now — every method throws
 * `NOT_IMPLEMENTED` until the ordering workflow is built out. The signatures,
 * however, are the real contract that callers and future implementers code
 * against.
 */
export class DefaultOrderFacade implements OrderFacade {
  async placeOrder(_customerId: string, _request: PlaceOrderRequest): Promise<OrderDto> {
    throw notImplemented('Order placement');
  }

  async recordPayment(_customerId: string, _request: RecordPaymentRequest): Promise<PaymentDto> {
    throw notImplemented('Order payment workflow');
  }

  async updateOrderStatus(_orderId: string, _nextStatus: OrderStatusDto): Promise<OrderDto> {
    throw notImplemented('Order status update');
  }
}
