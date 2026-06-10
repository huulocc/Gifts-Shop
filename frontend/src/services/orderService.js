import { buildQuery, request, useMockApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeOrder } from "./normalizers.js";

export const orderService = {
  async createOrder(payload) {
    if (useMockApi) return mockApi.createOrder(payload);
    return normalizeOrder(
      await request("/api/orders", {
        method: "POST",
        body: payload,
      })
    );
  },

  async listMyOrders(params = {}) {
    if (useMockApi) return mockApi.listOrders(params);
    const orders = await request(`/api/orders${buildQuery(params)}`);
    return (orders || []).map((order) => normalizeOrder(order));
  },

  async getMyOrder(id) {
    if (useMockApi) return mockApi.getOrder(id);
    return normalizeOrder(await request(`/api/orders/${id}`));
  },

  async listAllOrders(params = {}) {
    const nextParams = { ...params, scope: "all" };
    if (useMockApi) return mockApi.listOrders(nextParams);
    const orders = await request(`/api/orders${buildQuery(nextParams)}`);
    return (orders || []).map((order) => normalizeOrder(order));
  },

  async getManagerOrder(id) {
    if (useMockApi) return mockApi.getOrder(id, { scope: "manager" });
    return normalizeOrder(await request(`/api/orders/${id}${buildQuery({ scope: "manager" })}`));
  },

  async updateStatus(id, orderStatus) {
    if (useMockApi) return mockApi.updateOrderStatus(id, orderStatus);
    return normalizeOrder(
      await request(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: { orderStatus },
      })
    );
  },
};
