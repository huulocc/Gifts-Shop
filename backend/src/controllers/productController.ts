import { ProductService } from '../services/productService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';

function readSearch(req: { query: Record<string, unknown> }): string {
  return typeof req.query.search === 'string' ? req.query.search : '';
}

function readCategoryId(req: { query: Record<string, unknown> }): string {
  return typeof req.query.categoryId === 'string' ? req.query.categoryId : '';
}

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  listProducts = asyncHandler(async (req, res) => {
    sendData(
      res,
      await this.productService.listProducts({
        search: readSearch(req),
        categoryId: readCategoryId(req),
      }),
    );
  });

  listManagerProducts = asyncHandler(async (req, res) => {
    sendData(
      res,
      await this.productService.listProducts({
        includeInactive: true,
        search: readSearch(req),
        categoryId: readCategoryId(req),
      }),
    );
  });

  getProduct = asyncHandler(async (req, res) => {
    sendData(res, await this.productService.getProduct(req.params.id));
  });

  createProduct = asyncHandler(async (req, res) => {
    sendData(res, await this.productService.createProduct(req.body), 201);
  });

  updateProduct = asyncHandler(async (req, res) => {
    sendData(res, await this.productService.updateProduct(req.params.id, req.body));
  });

  updateStock = asyncHandler(async (req, res) => {
    sendData(res, await this.productService.updateStock(req.params.id, req.body?.quantity));
  });

  softDisableProduct = asyncHandler(async (req, res) => {
    sendData(res, await this.productService.softDisableProduct(req.params.id));
  });
}
