import { request, useMockApi, useRealCartApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeVoucherQuote } from "./normalizers.js";

export const voucherService = {
  async applyVoucher(voucherCode) {
    if (useMockApi && !useRealCartApi) {
      return normalizeVoucherQuote(await mockApi.applyVoucher({ voucherCode }));
    }
    return normalizeVoucherQuote(
      await request("/api/vouchers/apply", {
        method: "POST",
        body: { voucherCode },
      })
    );
  },
};
