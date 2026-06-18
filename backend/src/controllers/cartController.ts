import { CartService } from '../services/cartService';
import {
  addToCartSchema,
  type AddToCartDto,
  updateCartItemSchema,
  type UpdateCartItemDto,
} from '../schemas/cartSchemas';
import type { AuthenticatedRequest } from '../types/api';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';
import { isApiError } from '../utils/apiError';

export class CartController {
  constructor(private readonly cartService: CartService) {}

  addToCart = asyncHandler(async (req, res, next) => {
    const authenticatedRequest = req as AuthenticatedRequest;

    // Sequence Diagram - Step 3: validate productId and quantity in the controller.
    const validation = addToCartSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid product information',
      });
      return;
    }

    const dto: AddToCartDto = validation.data;
    const customerId = authenticatedRequest.user!.id;
    const productId = String(dto.productId);

    try {
      // Sequence Diagram - Step 4: delegate business flow to CartService.
      const data = await this.cartService.addToCart(customerId, productId, dto.quantity);

      res.status(200).json({
        success: true,
        message: 'Added to cart',
        data,
      });
    } catch (error) {
      // Sequence Diagram - Step 5: stop with the specified 404 response.
      if (isApiError(error) && error.code === 'PRODUCT_NOT_FOUND') {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  });

  getCart = asyncHandler(async (req, res) => {
    const customerId = (req as AuthenticatedRequest).user!.id;
    sendData(res, await this.cartService.getCart(customerId));
  });

  getCartSummary = asyncHandler(async (req, res) => {
    const customerId = (req as AuthenticatedRequest).user!.id;
    sendData(res, await this.cartService.getCartSummary(customerId));
  });

  updateItem = asyncHandler(async (req, res) => {
    const validation = updateCartItemSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: 'Invalid cart item quantity' });
      return;
    }
    const customerId = (req as AuthenticatedRequest).user!.id;
    const dto: UpdateCartItemDto = validation.data;
    sendData(res, await this.cartService.updateItem(customerId, req.params.itemId, dto.quantity));
  });

  increaseItem = asyncHandler(async (req, res) => {
    const customerId = (req as AuthenticatedRequest).user!.id;
    sendData(res, await this.cartService.adjustItem(customerId, req.params.itemId, 1));
  });

  decreaseItem = asyncHandler(async (req, res) => {
    const customerId = (req as AuthenticatedRequest).user!.id;
    sendData(res, await this.cartService.adjustItem(customerId, req.params.itemId, -1));
  });

  removeItem = asyncHandler(async (req, res) => {
    const customerId = (req as AuthenticatedRequest).user!.id;
    sendData(res, await this.cartService.removeItem(customerId, req.params.itemId));
  });

  clearCart = asyncHandler(async (req, res) => {
    const customerId = (req as AuthenticatedRequest).user!.id;
    sendData(res, await this.cartService.clearCart(customerId));
  });
}
