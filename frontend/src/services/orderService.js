import { buildQuery, request, useMockApi, useRealCartApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeOrder } from "./normalizers.js";

export const orderService = {
  async createOrder(payload) {
    // An order consumes the real customer cart, so both must use the same data source.
    if (useMockApi && !useRealCartApi) return mockApi.createOrder(payload);
    return normalizeOrder(
      await request("/api/orders", {
        method: "POST",
        body: payload,
      })
    );
  },

  async listMyOrders(params = {}) {
    if (useMockApi && !useRealCartApi) return mockApi.listOrders(params);
    const orders = await request(`/api/orders${buildQuery(params)}`);
    return (orders || []).map((order) => normalizeOrder(order));
  },

  async getMyOrder(id) {
    if (useMockApi && !useRealCartApi) return mockApi.getOrder(id);
    return normalizeOrder(await request(`/api/orders/${id}`));
  },

  async placeOrder(id) {
    if (useMockApi && !useRealCartApi) return normalizeOrder(await mockApi.placeOrder(id));
    return normalizeOrder(
      await request(`/api/orders/${id}/place`, {
        method: "POST",
      })
    );
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
