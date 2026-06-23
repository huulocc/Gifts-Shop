import type { CartRepository } from '../repositories/cartRepository';
import type { ProductRepository } from '../repositories/productRepository';
import { ApiError } from '../utils/apiError';
import { moneyToString, multiplyMoney } from '../utils/money';

export interface AddToCartResult {
  productId: string;
  quantity: number;
  totalItems: number;
}

export interface CartDto {
  id: string;
  items: Array<{
    id: string;
    quantity: number;
    lineTotal: string;
    product: {
      id: string;
      categoryId: string;
      category: { id: string; name: string; description: string | null; isActive: boolean };
      name: string;
      description: string | null;
      unitPrice: string;
      imageUrl: string | null;
      isActive: boolean;
      quantity: number;
    };
  }>;
  subtotal: string;
  total: string;
  totalItems: number;
}

export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  // Sequence Diagram - Steps 4-7: find product, create/update CartItem, then count items.
  async addToCart(
    customerId: string,
    productId: string,
    quantity: number,
  ): Promise<AddToCartResult> {
    // Step 5: ProductRepository filters by id and isActive=true.
    const product = await this.productRepository.findProductById(productId);
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const cartItems = await this.cartRepository.findCartItemsByCustomer(customerId);
    const existingQuantity = cartItems.find((item) => item.productId === productId)?.quantity ?? 0;
    if (product.quantity < existingQuantity + quantity) {
      throw new ApiError(409, 'STOCK_CONFLICT', 'Stock is no longer available for this quantity');
    }

    // Step 6: persist the cart line without changing Product.quantity.
    await this.cartRepository.addItem(customerId, productId, quantity);

    // Step 7: return the cart item count after persistence succeeds.
    const totalItems = await this.cartRepository.countCartItems(customerId);
    return { productId, quantity, totalItems };
  }

  // Manage Cart - View: enrich cart lines with ProductRepository data and totals.
  async getCart(customerId: string): Promise<CartDto> {
    const cartItems = await this.cartRepository.findCartItemsByCustomer(customerId);
    if (cartItems.length === 0) {
      return { id: '', items: [], subtotal: '0.00', total: '0.00', totalItems: 0 };
    }

    const products = await this.productRepository.findProductsByIds(
      cartItems.map((item) => item.productId),
    );
    const productById = new Map(products.map((product) => [product.id, product]));
    const items = cartItems.flatMap((item) => {
      const product = productById.get(item.productId);
      if (!product) return [];
      return [{
        id: item.id,
        quantity: item.quantity,
        lineTotal: multiplyMoney(product.unitPrice, item.quantity),
        product: {
          id: product.id,
          categoryId: product.categoryId,
          category: {
            id: product.category.id,
            name: product.category.name,
            description: product.category.description,
            isActive: product.category.isActive,
          },
          name: product.name,
          description: product.description,
          unitPrice: moneyToString(product.unitPrice),
          imageUrl: product.imageUrl,
          isActive: product.isActive,
          quantity: product.quantity,
        },
      }];
    });
    const subtotal = items
      .reduce((sum, item) => sum + Number(item.lineTotal), 0)
      .toFixed(2);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    return { id: cartItems[0].cartId, items, subtotal, total: subtotal, totalItems };
  }

  // Manage Cart - Update: set an absolute quantity and return the refreshed cart.
  async updateItem(customerId: string, cartItemId: string, quantity: number): Promise<CartDto> {
    const item = await this.cartRepository.findCartItemByCustomer(customerId, cartItemId);
    if (!item) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found');
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(400, 'INVALID_QUANTITY', 'Quantity must be greater than zero');
    }

    const product = await this.productRepository.findProductById(item.productId);
    if (!product || product.quantity < quantity) {
      throw new ApiError(409, 'STOCK_CONFLICT', 'Stock is no longer available for this quantity');
    }
    const updated = await this.cartRepository.updateItemQuantity(
      customerId,
      cartItemId,
      quantity,
    );
    if (!updated) {
      throw new ApiError(409, 'STOCK_CONFLICT', 'Stock is no longer available for this quantity');
    }
    return this.getCart(customerId);
  }

  // Manage Cart - Increase/Decrease buttons from the sequence diagram.
  async adjustItem(customerId: string, cartItemId: string, difference: 1 | -1): Promise<CartDto> {
    const item = await this.cartRepository.findCartItemByCustomer(customerId, cartItemId);
    if (!item) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found');
    return this.updateItem(customerId, cartItemId, item.quantity + difference);
  }

  // Manage Cart - Remove: delete only the cart line; stock has not been reserved.
  async removeItem(customerId: string, cartItemId: string): Promise<CartDto> {
    const deleted = await this.cartRepository.deleteCartItem(customerId, cartItemId);
    if (!deleted) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found');
    return this.getCart(customerId);
  }

  // Manage Cart - Clear: delete cart lines without touching product stock.
  async clearCart(customerId: string): Promise<CartDto> {
    await this.cartRepository.clearCart(customerId);
    return this.getCart(customerId);
  }

  // Manage Cart - Proceed Checkout: validate that the cart has at least one line.
  async getCartSummary(customerId: string): Promise<CartDto> {
    const cart = await this.getCart(customerId);
    if (cart.items.length === 0) throw new ApiError(400, 'EMPTY_CART', 'Your cart is empty');
    return cart;
  }
}
