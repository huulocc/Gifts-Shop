import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
} from '@prisma/client';
import type { ApiRole } from '../types/api';
import type { OrderStatusDto, PaymentMethodDto, PaymentStatusDto } from '../types/domain';
import { ApiError } from './apiError';

const roleToApiMap: Record<Role, ApiRole> = {
  [Role.CUSTOMER]: 'customer',
  [Role.MANAGER]: 'manager',
};

const apiRoleToPrismaMap: Record<ApiRole, Role> = {
  customer: Role.CUSTOMER,
  manager: Role.MANAGER,
};

const orderStatusToApiMap: Record<OrderStatus, OrderStatusDto> = {
  [OrderStatus.PENDING]: 'pending',
  [OrderStatus.PLACED]: 'placed',
  [OrderStatus.PAID]: 'paid',
  [OrderStatus.CANCELLED]: 'cancelled',
  [OrderStatus.COMPLETED]: 'completed',
};

const apiOrderStatusToPrismaMap: Record<OrderStatusDto, OrderStatus> = {
  pending: OrderStatus.PENDING,
  placed: OrderStatus.PLACED,
  paid: OrderStatus.PAID,
  cancelled: OrderStatus.CANCELLED,
  completed: OrderStatus.COMPLETED,
};

const paymentMethodToApiMap: Record<PaymentMethod, PaymentMethodDto> = {
  [PaymentMethod.CASH]: 'cash',
  [PaymentMethod.CREDIT_CARD]: 'credit_card',
  [PaymentMethod.PAYPAL]: 'paypal',
  [PaymentMethod.BANK_TRANSFER]: 'bank_transfer',
};

const apiPaymentMethodToPrismaMap: Record<PaymentMethodDto, PaymentMethod> = {
  cash: PaymentMethod.CASH,
  credit_card: PaymentMethod.CREDIT_CARD,
  paypal: PaymentMethod.PAYPAL,
  bank_transfer: PaymentMethod.BANK_TRANSFER,
};

const paymentStatusToApiMap: Record<PaymentStatus, PaymentStatusDto> = {
  [PaymentStatus.PENDING]: 'pending',
  [PaymentStatus.COMPLETED]: 'completed',
  [PaymentStatus.FAILED]: 'failed',
  [PaymentStatus.REFUNDED]: 'refunded',
};

export function roleToApi(role: Role): ApiRole {
  return roleToApiMap[role];
}

export function apiRoleToPrisma(role: ApiRole): Role {
  return apiRoleToPrismaMap[role];
}

export function orderStatusToApi(status: OrderStatus): OrderStatusDto {
  return orderStatusToApiMap[status];
}

export function apiOrderStatusToPrisma(status: OrderStatusDto): OrderStatus {
  return apiOrderStatusToPrismaMap[status];
}

export function paymentMethodToApi(method: PaymentMethod | null): PaymentMethodDto | null {
  return method ? paymentMethodToApiMap[method] : null;
}

export function apiPaymentMethodToPrisma(method: PaymentMethodDto): PaymentMethod {
  return apiPaymentMethodToPrismaMap[method];
}

export function paymentStatusToApi(status: PaymentStatus): PaymentStatusDto {
  return paymentStatusToApiMap[status];
}

export function parseApiRole(value: unknown): ApiRole {
  if (value === 'customer' || value === 'manager') return value;
  throw new ApiError(401, 'INVALID_TOKEN', 'Session token contains an invalid role.');
}
