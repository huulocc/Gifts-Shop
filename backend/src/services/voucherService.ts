import { Prisma, type Voucher } from '@prisma/client';
import type { CartRepository } from '../repositories/cartRepository';
import type { ProductRepository } from '../repositories/productRepository';
import type { VoucherRepository } from '../repositories/voucherRepository';
import type { VoucherDto, VoucherQuoteDto } from '../types/domain';
import { ApiError, badRequest, conflict } from '../utils/apiError';
import { moneyToString } from '../utils/money';

export function normalizeVoucherCode(code: string | null | undefined): string {
  return String(code || '').trim().toUpperCase();
}

export function mapVoucher(voucher: Voucher): VoucherDto {
  return {
    id: voucher.id,
    code: voucher.code,
    percentage: moneyToString(voucher.percentage),
  };
}

export function calculateDiscountAmount(
  subtotal: Prisma.Decimal,
  percentage: Prisma.Decimal,
): Prisma.Decimal {
  const discount = Number(subtotal.toString()) * (Number(percentage.toString()) / 100);
  return new Prisma.Decimal(discount.toFixed(2));
}

export function isValidVoucherPercentage(percentage: Prisma.Decimal): boolean {
  const value = Number(percentage.toString());
  return value > 0 && value <= 100;
}

export class VoucherService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly voucherRepository: VoucherRepository,
  ) {}

  async quoteCart(customerId: string, voucherCode: string): Promise<VoucherQuoteDto> {
    const voucher = await this.findActiveVoucher(voucherCode);
    const subtotalAmount = await this.calculateCurrentCartSubtotal(customerId);
    const discountAmount = calculateDiscountAmount(subtotalAmount, voucher.percentage);
    const totalAmount = subtotalAmount.minus(discountAmount);

    return {
      voucher: mapVoucher(voucher),
      subtotalAmount: moneyToString(subtotalAmount),
      discountAmount: moneyToString(discountAmount),
      totalAmount: moneyToString(totalAmount),
    };
  }

  async findActiveVoucher(voucherCode: string | null | undefined): Promise<Voucher> {
    const code = normalizeVoucherCode(voucherCode);
    if (!code) {
      throw badRequest('Voucher code is required.', {
        voucherCode: 'Enter a voucher code.',
      });
    }

    const voucher = await this.voucherRepository.findActiveByCode(code);
    if (!voucher || !isValidVoucherPercentage(voucher.percentage)) {
      throw badRequest('Voucher code is invalid or inactive.', {
        voucherCode: 'Enter an active voucher code.',
      });
    }

    return voucher;
  }

  private async calculateCurrentCartSubtotal(customerId: string): Promise<Prisma.Decimal> {
    const cartItems = await this.cartRepository.findCartItemsByCustomer(customerId);
    if (cartItems.length === 0) {
      throw new ApiError(400, 'EMPTY_CART', 'Your cart is empty');
    }

    const products = await this.productRepository.findProductsByIds(
      cartItems.map((item) => item.productId),
    );
    const productsById = new Map(products.map((product) => [product.id, product]));

    return cartItems.reduce((subtotal, cartItem) => {
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
      return subtotal.plus(product.unitPrice.mul(cartItem.quantity));
    }, new Prisma.Decimal(0));
  }
}
