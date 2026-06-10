import { buildQuery, request, useMockApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeUser } from "./normalizers.js";

export const authService = {
  async register(payload) {
    if (useMockApi) return mockApi.register(payload);
    return normalizeUser(
      await request("/api/auth/register", {
        method: "POST",
        body: payload,
      })
    );
  },

  async login(payload) {
    if (useMockApi) return mockApi.login(payload);
    const data = await request("/api/auth/login", {
      method: "POST",
      body: payload,
    });
    return normalizeUser(data.user || data);
  },

  async logout() {
    if (useMockApi) return mockApi.logout();
    return request("/api/auth/logout", { method: "POST" });
  },

  async getCurrentUser() {
    if (useMockApi) return mockApi.getCurrentUser();
    try {
      return normalizeUser(await request("/api/auth/me"));
    } catch (error) {
      if (error.status === 401) return null;
      throw error;
    }
  },

  async changePassword(payload) {
    if (useMockApi) return mockApi.changePassword(payload);
    return request("/api/auth/change-password", {
      method: "POST",
      body: payload,
    });
  },

  buildLoginRedirect(params) {
    return `/login${buildQuery(params)}`;
  },
};
