import { buildQuery, request, useMockApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizePayment } from "./normalizers.js";

export const paymentService = {
  async recordPayment(payload) {
    if (useMockApi) return mockApi.recordPayment(payload);
    return normalizePayment(
      await request("/api/payments", {
        method: "POST",
        body: payload,
      })
    );
  },

  async getOrderPayments(orderId, params = {}) {
    const nextParams = { ...params, orderId };
    if (useMockApi) return mockApi.getOrderPayments(orderId, params);
    const payments = await request(`/api/payments${buildQuery(nextParams)}`);
    return (payments || []).map((payment) => normalizePayment(payment));
  },
};
