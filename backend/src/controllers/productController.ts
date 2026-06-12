import { ProductService } from '../services/productService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  listProducts = asyncHandler(async (_req, res) => {
    sendData(res, await this.productService.listProducts());
  });

  getProduct = asyncHandler(async (_req, res) => {
    sendData(res, await this.productService.getProduct());
  });

  createProduct = asyncHandler(async (_req, res) => {
    sendData(res, await this.productService.createProduct(), 201);
  });

  updateProduct = asyncHandler(async (_req, res) => {
    sendData(res, await this.productService.updateProduct());
  });

  updateStock = asyncHandler(async (_req, res) => {
    sendData(res, await this.productService.updateStock());
  });

  softDisableProduct = asyncHandler(async (_req, res) => {
    sendData(res, await this.productService.softDisableProduct());
  });
}
