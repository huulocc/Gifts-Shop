import type { CartItem, PrismaClient } from '@prisma/client';

export interface CartRepository {
  findCartItemsByCustomer(customerId: string): Promise<CartItem[]>;
  findCartItemByCustomer(customerId: string, cartItemId: string): Promise<CartItem | null>;
  reserveAndAdd(customerId: string, productId: string, quantity: number): Promise<boolean>;
  updateItemQuantityWithStock(
    customerId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartItem | null>;
  deleteCartItemWithStock(customerId: string, cartItemId: string): Promise<boolean>;
  clearCartWithStock(customerId: string): Promise<void>;
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

  // Add To Cart - reserve product stock and insert/increment CartItem atomically.
  async reserveAndAdd(
    customerId: string,
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const reserved = await tx.product.updateMany({
        where: { id: productId, isActive: true, quantity: { gte: quantity } },
        data: { quantity: { decrement: quantity } },
      });
      if (reserved.count !== 1) return false;

      const cart = await tx.cart.upsert({
        where: { userId: customerId },
        update: {},
        create: { userId: customerId },
      });
      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        update: { quantity: { increment: quantity } },
        create: { cartId: cart.id, productId, quantity },
      });
      return true;
    });
  }

  // Manage Cart - Update: reserve or restore only the changed stock quantity.
  async updateItemQuantityWithStock(
    customerId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartItem | null> {
    return this.db.$transaction(async (tx) => {
      const item = await tx.cartItem.findFirst({
        where: { id: cartItemId, cart: { userId: customerId } },
      });
      if (!item) return null;

      const difference = quantity - item.quantity;
      if (difference > 0) {
        const reserved = await tx.product.updateMany({
          where: { id: item.productId, isActive: true, quantity: { gte: difference } },
          data: { quantity: { decrement: difference } },
        });
        if (reserved.count !== 1) return null;
      } else if (difference < 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: Math.abs(difference) } },
        });
      }

      return tx.cartItem.update({ where: { id: item.id }, data: { quantity } });
    });
  }

  // Manage Cart - Remove: hard-delete the line and restore all reserved stock.
  async deleteCartItemWithStock(customerId: string, cartItemId: string): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const item = await tx.cartItem.findFirst({
        where: { id: cartItemId, cart: { userId: customerId } },
      });
      if (!item) return false;
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
      await tx.cartItem.delete({ where: { id: item.id } });
      return true;
    });
  }

  // Manage Cart - Clear: restore every reserved quantity, then delete all lines.
  async clearCartWithStock(customerId: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const items = await tx.cartItem.findMany({ where: { cart: { userId: customerId } } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }
      await tx.cartItem.deleteMany({ where: { cart: { userId: customerId } } });
    });
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
