import type { CartItem, PrismaClient } from '@prisma/client';

export interface CartRepository {
  findCartItemsByCustomer(customerId: string): Promise<CartItem[]>;
  findCartItemByCustomer(customerId: string, cartItemId: string): Promise<CartItem | null>;
  addItem(customerId: string, productId: string, quantity: number): Promise<CartItem>;
  updateItemQuantity(
    customerId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartItem | null>;
  deleteCartItem(customerId: string, cartItemId: string): Promise<boolean>;
  clearCart(customerId: string): Promise<void>;
  countCartItems(customerId: string): Promise<number>;
}

export class PrismaCartRepository implements CartRepository {
  constructor(private readonly db: PrismaClient) {}

  // Manage Cart - View: select all CartItems owned by the authenticated customer.
  async findCartItemsByCustomer(customerId: string): Promise<CartItem[]> {
    return this.db.cartItem.findMany({
      where: { cart: { userId: customerId } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findCartItemByCustomer(customerId: string, cartItemId: string): Promise<CartItem | null> {
    return this.db.cartItem.findFirst({
      where: { id: cartItemId, cart: { userId: customerId } },
    });
  }

  // Cart only stores purchase intent. Product stock is decremented during Place Order.
  async addItem(customerId: string, productId: string, quantity: number): Promise<CartItem> {
    return this.db.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId: customerId },
        update: {},
        create: { userId: customerId },
      });
      return tx.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        update: { quantity: { increment: quantity } },
        create: { cartId: cart.id, productId, quantity },
      });
    });
  }

  async updateItemQuantity(
    customerId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartItem | null> {
    const item = await this.db.cartItem.findFirst({
      where: { id: cartItemId, cart: { userId: customerId } },
    });
    if (!item) return null;
    return this.db.cartItem.update({ where: { id: item.id }, data: { quantity } });
  }

  async deleteCartItem(customerId: string, cartItemId: string): Promise<boolean> {
    const result = await this.db.cartItem.deleteMany({
      where: { id: cartItemId, cart: { userId: customerId } },
    });
    return result.count === 1;
  }

  async clearCart(customerId: string): Promise<void> {
    await this.db.cartItem.deleteMany({ where: { cart: { userId: customerId } } });
  }

  // Sequence Diagram - Step 7: sum quantities after insert/update.
  async countCartItems(customerId: string): Promise<number> {
    const result = await this.db.cartItem.aggregate({
      where: { cart: { userId: customerId } },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
}
