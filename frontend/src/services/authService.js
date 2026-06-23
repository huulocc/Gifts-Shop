import {
  buildQuery,
  request,
  useMockApi,
  useRealCartApi,
} from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeUser } from "./normalizers.js";

export const authService = {
  async register(payload) {
    if (useMockApi && !useRealCartApi) return mockApi.register(payload);
    const data = await request("/api/auth/register", {
      method: "POST",
      body: payload,
    });
    return normalizeUser(data.user || data);
  },

  async login(payload) {
    if (useMockApi && !useRealCartApi) return mockApi.login(payload);
    const data = await request("/api/auth/login", {
      method: "POST",
      body: payload,
    });
    return normalizeUser(data.user || data);
  },

  async logout() {
    if (useMockApi && !useRealCartApi) return mockApi.logout();
    return request("/api/auth/logout", { method: "POST" });
  },

  async getCurrentUser() {
    if (useMockApi && !useRealCartApi) return mockApi.getCurrentUser();
    try {
      return normalizeUser(await request("/api/auth/me"));
    } catch (error) {
      if (error.status === 401) return null;
      throw error;
    }
  },

  async changePassword(payload) {
    if (useMockApi && !useRealCartApi) return mockApi.changePassword(payload);
    return request("/api/auth/change-password", {
      method: "POST",
      body: payload,
    });
  },

  buildLoginRedirect(params) {
    return `/login${buildQuery(params)}`;
  },
};
