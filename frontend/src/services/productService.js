import { buildQuery, request, useMockApi, useRealCartApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeProduct } from "./normalizers.js";

const backendSeedProductIds = new Set(["seed-bracelet", "seed-music-box"]);

export const productService = {
  async listProducts(params = {}) {
    if (useMockApi) {
      const products = await mockApi.listProducts(params);
      return useRealCartApi
        ? products.filter((product) => backendSeedProductIds.has(product.id))
        : products;
    }
    const products = await request(`/api/products${buildQuery(params)}`);
    return (products || []).map((product) => normalizeProduct(product));
  },

  async getProduct(id, options = {}) {
    if (useMockApi) return mockApi.getProduct(id, options);
    return normalizeProduct(await request(`/api/products/${id}${buildQuery(options)}`));
  },

  async createProduct(payload) {
    if (useMockApi) return mockApi.createProduct(payload);
    return normalizeProduct(
      await request("/api/products", {
        method: "POST",
        body: payload,
      })
    );
  },

  async updateProduct(id, payload) {
    if (useMockApi) return mockApi.updateProduct(id, payload);
    return normalizeProduct(
      await request(`/api/products/${id}`, {
        method: "PUT",
        body: payload,
      })
    );
  },

  async updateStock(id, quantity) {
    if (useMockApi) return mockApi.updateStock(id, quantity);
    return normalizeProduct(
      await request(`/api/products/${id}/stock`, {
        method: "PATCH",
        body: { quantity },
      })
    );
  },

  async softDisableProduct(id) {
    if (useMockApi) return mockApi.softDisableProduct(id);
    return normalizeProduct(
      await request(`/api/products/${id}`, {
        method: "DELETE",
      })
    );
  },
};
