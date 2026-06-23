import { buildQuery, request, useMockApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeCategory } from "./normalizers.js";

export const categoryService = {
  async listCategories(params = {}) {
    if (useMockApi) return mockApi.listCategories(params);
    const categories = await request(`/api/categories${buildQuery(params)}`);
    return (categories || []).map((category) => normalizeCategory(category));
  },

  async listManagerCategories(params = {}) {
    const categories = await request(`/api/manager/categories${buildQuery(params)}`);
    return (categories || []).map((category) => normalizeCategory(category));
  },

  async createCategory(payload) {
    return normalizeCategory(
      await request("/api/manager/categories", {
        method: "POST",
        body: payload,
      })
    );
  },

  async updateCategory(id, payload) {
    return normalizeCategory(
      await request(`/api/manager/categories/${id}`, {
        method: "PUT",
        body: payload,
      })
    );
  },

  async softDisableCategory(id) {
    return normalizeCategory(
      await request(`/api/manager/categories/${id}`, {
        method: "DELETE",
      })
    );
  },
};
