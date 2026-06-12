import type { ApiRole } from './api';

export type OrderStatusDto = 'pending' | 'placed' | 'paid' | 'cancelled' | 'completed';
export type PaymentMethodDto = 'cash' | 'credit_card' | 'paypal' | 'bank_transfer';
export type PaymentStatusDto = 'pending' | 'completed' | 'failed' | 'refunded';

export interface UserDto {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  email: string;
  role: ApiRole;
}

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface ProductDto {
  id: string;
  categoryId: string;
  category?: Pick<CategoryDto, 'id' | 'name'> | null;
  name: string;
  description: string | null;
  unitPrice: string;
  imageUrl: string | null;
  isActive: boolean;
  quantity: number;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface PaymentDto {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethodDto;
  paymentDate: string;
  amount: string;
  status: PaymentStatusDto;
}

export interface OrderDto {
  id: string;
  customer?: UserDto;
  giftMessage: string | null;
  orderStatus: OrderStatusDto;
  paymentMethod: PaymentMethodDto | null;
  totalAmount: string;
  items: OrderItemDto[];
  payments?: PaymentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface RevenueSummaryDto {
  totalRevenue: string;
  countedOrderCount: number;
  paidRevenue: string;
  completedRevenue: string;
  excluded: {
    pending: number;
    placed: number;
    cancelled: number;
  };
  countedOrders: OrderDto[];
}
