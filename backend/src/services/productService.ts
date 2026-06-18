import type { Product } from '@prisma/client';
import type { CategoryRepository } from '../repositories/categoryRepository';
import type { ProductRepository, ProductWithCategory } from '../repositories/productRepository';
import type { ProductDto } from '../types/domain';
import { badRequest, conflict, resourceNotFound } from '../utils/apiError';

export interface ProductInput {
  name?: unknown;
  categoryId?: unknown;
  description?: unknown;
  unitPrice?: unknown;
  imageUrl?: unknown;
  isActive?: unknown;
  quantity?: unknown;
}

export interface ProductListInput {
  includeInactive?: boolean;
  search?: string;
  categoryId?: string;
}

interface NormalizedProductInput {
  name: string;
  categoryId: string;
  description: string | null;
  unitPrice: string;
  imageUrl: string | null;
  isActive: boolean;
  quantity: number;
}

function toProductDto(product: ProductWithCategory): ProductDto {
  return {
    id: product.id,
    categoryId: product.categoryId,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
        }
      : null,
    name: product.name,
    description: product.description,
    unitPrice: product.unitPrice.toFixed(2),
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    quantity: product.quantity,
  };
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalUrl(value: unknown): string | null {
  const imageUrl = readString(value);
  if (!imageUrl) return null;

  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return imageUrl;
    }
  } catch {
    // Converted to a field error below.
  }

  throw badRequest('Image URL must be a valid http or https URL.', {
    imageUrl: 'Image URL must be a valid http or https URL.',
  });
}

function normalizeMoney(value: unknown): string | null {
  const raw = typeof value === 'number' ? String(value) : readString(value);
  const amount = Number(raw);
  if (!raw || Number.isNaN(amount) || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return amount.toFixed(2);
}

function normalizeQuantity(value: unknown): number | null {
  const quantity = typeof value === 'number' ? value : Number(readString(value));
  if (!Number.isInteger(quantity) || quantity < 0) return null;
  return quantity;
}

function normalizeProductInput(input: ProductInput, current?: Product): NormalizedProductInput {
  const fields: Record<string, string> = {};
  const name = readString(input.name);
  const categoryId = readString(input.categoryId);
  const unitPrice = normalizeMoney(input.unitPrice);
  const quantity = normalizeQuantity(input.quantity);

  if (!name) fields.name = 'Product name is required.';
  if (!categoryId) fields.categoryId = 'Category is required.';
  if (!unitPrice) fields.unitPrice = 'Unit price must be greater than 0.';
  if (quantity === null) fields.quantity = 'Stock quantity must be a whole number at least 0.';

  if (Object.keys(fields).length) {
    throw badRequest('Product input is invalid.', fields);
  }

  return {
    name,
    categoryId,
    description: readString(input.description) || null,
    unitPrice: unitPrice!,
    imageUrl: normalizeOptionalUrl(input.imageUrl),
    isActive:
      typeof input.isActive === 'boolean'
        ? input.isActive
        : current?.isActive ?? true,
    quantity: quantity!,
  };
}

function normalizeStockInput(quantity: unknown): number {
  const normalized = normalizeQuantity(quantity);
  if (normalized === null) {
    throw badRequest('Stock quantity must be a whole number at least 0.', {
      quantity: 'Stock quantity must be a whole number at least 0.',
    });
  }
  return normalized;
}

export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async listProducts(input: ProductListInput = {}): Promise<ProductDto[]> {
    const products = await this.productRepository.findAll({
      includeInactive: Boolean(input.includeInactive),
      includeInactiveCategories: Boolean(input.includeInactive),
      search: input.search,
      categoryId: input.categoryId,
    });
    return products.map(toProductDto);
  }

  async getProduct(id: string, options: { includeInactive?: boolean } = {}): Promise<ProductDto> {
    const product = await this.productRepository.findById(id, {
      includeInactive: options.includeInactive,
    });
    if (!product) {
      throw resourceNotFound('Product not found.');
    }
    return toProductDto(product);
  }

  async createProduct(input: ProductInput): Promise<ProductDto> {
    const data = normalizeProductInput(input);
    await this.assertCategoryExists(data.categoryId);
    await this.assertProductNameAvailable(data.name);

    const product = await this.productRepository.create(data);
    return toProductDto(product);
  }

  async updateProduct(id: string, input: ProductInput): Promise<ProductDto> {
    const current = await this.productRepository.findById(id, { includeInactive: true });
    if (!current) {
      throw resourceNotFound('Product not found.');
    }

    const data = normalizeProductInput(input, current);
    await this.assertCategoryExists(data.categoryId);
    await this.assertProductNameAvailable(data.name, id);

    const product = await this.productRepository.update(id, data);
    return toProductDto(product);
  }

  async updateStock(id: string, quantityInput: unknown): Promise<ProductDto> {
    const current = await this.productRepository.findById(id, { includeInactive: true });
    if (!current) {
      throw resourceNotFound('Product not found.');
    }

    const product = await this.productRepository.updateStock(id, normalizeStockInput(quantityInput));
    return toProductDto(product);
  }

  async softDisableProduct(id: string): Promise<ProductDto> {
    const current = await this.productRepository.findById(id, { includeInactive: true });
    if (!current) {
      throw resourceNotFound('Product not found.');
    }

    const product = await this.productRepository.softDisable(id);
    return toProductDto(product);
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw resourceNotFound('Category does not exist.');
    }
  }

  private async assertProductNameAvailable(name: string, excludedId?: string): Promise<void> {
    const existing = excludedId
      ? await this.productRepository.findByNameExceptId(name, excludedId)
      : await this.productRepository.findByName(name);

    if (existing) {
      throw conflict('Product name already exists.', {
        name: 'Product name already exists.',
      });
    }
  }
}
