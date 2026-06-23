import { buildQuery, request, useMockApi, useRealCartApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizePayment } from "./normalizers.js";

export const paymentService = {
  async getOrderPayments(orderId, params = {}) {
    const nextParams = { ...params, orderId };
    if (useMockApi && !useRealCartApi) return mockApi.getOrderPayments(orderId, params);
    const payments = await request(`/api/payments${buildQuery(nextParams)}`);
    return (payments || []).map((payment) => normalizePayment(payment));
  },
};
