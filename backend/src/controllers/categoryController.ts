import { CategoryService } from '../services/categoryService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';

function readSearch(req: { query: Record<string, unknown> }): string {
  return typeof req.query.search === 'string' ? req.query.search : '';
}

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  listCategories = asyncHandler(async (req, res) => {
    sendData(res, await this.categoryService.listCategories({ search: readSearch(req) }));
  });

  listManagerCategories = asyncHandler(async (req, res) => {
    sendData(
      res,
      await this.categoryService.listCategories({
        includeInactive: true,
        search: readSearch(req),
      }),
    );
  });

  createCategory = asyncHandler(async (req, res) => {
    sendData(res, await this.categoryService.createCategory(req.body), 201);
  });

  updateCategory = asyncHandler(async (req, res) => {
    sendData(res, await this.categoryService.updateCategory(req.params.id, req.body));
  });

  softDisableCategory = asyncHandler(async (req, res) => {
    sendData(res, await this.categoryService.softDisableCategory(req.params.id));
  });
}
