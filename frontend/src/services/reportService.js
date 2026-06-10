import { request, useMockApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeRevenue } from "./normalizers.js";

export const reportService = {
  async getRevenueSummary() {
    if (useMockApi) return mockApi.getRevenueSummary();
    return normalizeRevenue(await request("/api/reports/revenue"));
  },
};
