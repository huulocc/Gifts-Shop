import { CartService } from '../services/cartService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';

export class CartController {
  constructor(private readonly cartService: CartService) {}

  getCart = asyncHandler(async (_req, res) => {
    sendData(res, await this.cartService.getCart());
  });

  addItem = asyncHandler(async (_req, res) => {
    sendData(res, await this.cartService.addItem(), 201);
  });

  updateItem = asyncHandler(async (_req, res) => {
    sendData(res, await this.cartService.updateItem());
  });

  removeItem = asyncHandler(async (_req, res) => {
    sendData(res, await this.cartService.removeItem());
  });

  clearCart = asyncHandler(async (_req, res) => {
    sendData(res, await this.cartService.clearCart());
  });
}
