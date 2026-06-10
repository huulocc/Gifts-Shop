import { request, useMockApi } from "./apiClient.js";
import { mockApi } from "./mockApi.js";
import { normalizeCart } from "./normalizers.js";

export const cartService = {
  async getCart() {
    if (useMockApi) return mockApi.getCart();
    return normalizeCart(await request("/api/cart"));
  },

  async addItem(payload) {
    if (useMockApi) return mockApi.addCartItem(payload);
    return normalizeCart(
      await request("/api/cart/items", {
        method: "POST",
        body: payload,
      })
    );
  },

  async updateItem(itemId, payload) {
    if (useMockApi) return mockApi.updateCartItem(itemId, payload);
    return normalizeCart(
      await request(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        body: payload,
      })
    );
  },

  async removeItem(itemId) {
    if (useMockApi) return mockApi.removeCartItem(itemId);
    return normalizeCart(
      await request(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      })
    );
  },

  async clearCart() {
    if (useMockApi) return mockApi.clearCart();
    return normalizeCart(
      await request("/api/cart/items", {
        method: "DELETE",
      })
    );
  },
};
