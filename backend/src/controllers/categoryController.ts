import { CategoryService } from '../services/categoryService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  listCategories = asyncHandler(async (_req, res) => {
    sendData(res, await this.categoryService.listCategories());
  });

  createCategory = asyncHandler(async (_req, res) => {
    sendData(res, await this.categoryService.createCategory(), 201);
  });

  updateCategory = asyncHandler(async (_req, res) => {
    sendData(res, await this.categoryService.updateCategory());
  });

  softDisableCategory = asyncHandler(async (_req, res) => {
    sendData(res, await this.categoryService.softDisableCategory());
  });
}
