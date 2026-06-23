import { request, useMockApi, useRealCartApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeCart } from "./normalizers.js";

export const cartService = {
  async getCart() {
    if (useMockApi && !useRealCartApi) return mockApi.getCart();
    return normalizeCart(await request("/api/cart"));
  },

  async addItem(payload) {
    if (useMockApi && !useRealCartApi) return mockApi.addCartItem(payload);
    await request("/api/cart/add", {
      method: "POST",
      body: payload,
    });
    return normalizeCart(await request("/api/cart"));
  },

  async updateItem(itemId, payload) {
    if (useMockApi && !useRealCartApi) return mockApi.updateCartItem(itemId, payload);
    return normalizeCart(
      await request(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        body: payload,
      })
    );
  },

  async removeItem(itemId) {
    if (useMockApi && !useRealCartApi) return mockApi.removeCartItem(itemId);
    return normalizeCart(
      await request(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      })
    );
  },

  async clearCart() {
    if (useMockApi && !useRealCartApi) return mockApi.clearCart();
    return normalizeCart(
      await request("/api/cart/items", {
        method: "DELETE",
      })
    );
  },
};
