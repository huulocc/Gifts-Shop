import { buildQuery, request, useMockApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeCategory } from "./normalizers.js";

export const categoryService = {
  async listCategories(params = {}) {
    if (useMockApi) return mockApi.listCategories(params);
    const categories = await request(`/api/categories${buildQuery(params)}`);
    return (categories || []).map((category) => normalizeCategory(category));
  },

  async createCategory(payload) {
    if (useMockApi) return mockApi.createCategory(payload);
    return normalizeCategory(
      await request("/api/categories", {
        method: "POST",
        body: payload,
      })
    );
  },

  async updateCategory(id, payload) {
    if (useMockApi) return mockApi.updateCategory(id, payload);
    return normalizeCategory(
      await request(`/api/categories/${id}`, {
        method: "PUT",
        body: payload,
      })
    );
  },

  async softDisableCategory(id) {
    if (useMockApi) return mockApi.softDisableCategory(id);
    return normalizeCategory(
      await request(`/api/categories/${id}`, {
        method: "DELETE",
      })
    );
  },
};
