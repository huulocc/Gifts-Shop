import { API_BASE_URL, buildQuery, request, useMockApi, useRealCartApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeUser } from "./normalizers.js";

async function syncBackendLogin(payload) {
  if (!API_BASE_URL) return;
  await request("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

async function syncBackendLogout() {
  if (!API_BASE_URL) return;
  await request("/api/auth/logout", { method: "POST" });
}

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
    if (useMockApi) {
      const user = await mockApi.login(payload);
      if (useRealCartApi || user.role === "manager") {
        try {
          await syncBackendLogin(payload);
        } catch (error) {
          if (user.role === "manager") throw error;
        }
      }
      return user;
    }

    const data = await request("/api/auth/login", {
      method: "POST",
      body: payload,
    });
    return normalizeUser(data.user || data);
  },

  async logout() {
    if (useMockApi) {
      const user = await mockApi.getCurrentUser();
      const result = await mockApi.logout();
      if (useRealCartApi || user?.role === "manager") {
        try {
          await syncBackendLogout();
        } catch {
          // Best-effort backend session cleanup while using mock auth.
        }
      }
      return result;
    }

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
