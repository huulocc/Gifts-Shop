import { request } from "./apiClient.js";
import { normalizeRevenue } from "./normalizers.js";

export const reportService = {
  async getRevenueSummary() {
    return normalizeRevenue(await request("/api/reports/revenue"));
  },
};
