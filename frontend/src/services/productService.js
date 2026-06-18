import { buildQuery, request, useMockApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeProduct } from "./normalizers.js";

export const productService = {
  async listProducts(params = {}) {
    if (useMockApi) return mockApi.listProducts(params);
    const products = await request(`/api/products${buildQuery(params)}`);
    return (products || []).map((product) => normalizeProduct(product));
  },

  async listManagerProducts(params = {}) {
    const products = await request(`/api/manager/products${buildQuery(params)}`);
    return (products || []).map((product) => normalizeProduct(product));
  },

  async getProduct(id, options = {}) {
    if (useMockApi) return mockApi.getProduct(id, options);
    return normalizeProduct(await request(`/api/products/${id}${buildQuery(options)}`));
  },

  async createProduct(payload) {
    return normalizeProduct(
      await request("/api/manager/products", {
        method: "POST",
        body: payload,
      })
    );
  },

  async updateProduct(id, payload) {
    return normalizeProduct(
      await request(`/api/manager/products/${id}`, {
        method: "PUT",
        body: payload,
      })
    );
  },

  async updateStock(id, quantity) {
    return normalizeProduct(
      await request(`/api/manager/products/${id}/stock`, {
        method: "PATCH",
        body: { quantity },
      })
    );
  },

  async softDisableProduct(id) {
    return normalizeProduct(
      await request(`/api/manager/products/${id}`, {
        method: "DELETE",
      })
    );
  },
};
