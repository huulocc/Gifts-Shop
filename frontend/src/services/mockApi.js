import { createInitialMockState } from "./mockData.js";
import {
  normalizeCart,
  normalizeCategory,
  normalizeOrder,
  normalizePayment,
  normalizeProduct,
  normalizeRevenue,
  normalizeUser,
  normalizeVoucherQuote,
} from "./normalizers.js";

const STORAGE_KEY = "giftshop.mock.state";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function delay() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 180);
  });
}

function loadState() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = createInitialMockState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  const state = JSON.parse(stored);
  if (!Array.isArray(state.vouchers)) {
    state.vouchers = createInitialMockState().vouchers;
    saveState(state);
  }
  return state;
}

function saveState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function error(message, options = {}) {
  const err = new Error(message);
  err.code = options.code || "MOCK_ERROR";
  err.status = options.status || 400;
  err.fields = options.fields || {};
  throw err;
}

function publicUser(user) {
  return normalizeUser(user);
}

function withCategory(state, product) {
  const category = state.categories.find((item) => item.id === product.categoryId);
  return normalizeProduct({ ...product, category });
}

function getCartForUser(state, userId) {
  let cart = state.carts.find((item) => item.userId === userId);
  if (!cart) {
    cart = { id: makeId("cart"), userId, items: [] };
    state.carts.push(cart);
  }
  const items = cart.items.map((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    return {
      id: item.id,
      product: product ? withCategory(state, product) : null,
      quantity: item.quantity,
    };
  }).filter((item) => item.product);
  return normalizeCart({ id: cart.id, items });
}

function currentUser(state) {
  const user = state.users.find((item) => item.id === state.sessionUserId);
  return user || null;
}

function requireUser(state, role) {
  const user = currentUser(state);
  if (!user) error("Please log in to continue.", { status: 401, code: "UNAUTHENTICATED" });
  if (role && user.role !== role) {
    error("This account cannot access that page.", { status: 403, code: "FORBIDDEN" });
  }
  return user;
}

function normalizeOrderWithRelations(state, order) {
  const customer = state.users.find((user) => user.id === order.customerId);
  const payments = state.payments.filter((payment) => payment.orderId === order.id);
  const voucher = order.voucher || (state.vouchers || []).find((item) => item.id === order.voucherId);
  return normalizeOrder({ ...order, customer, payments, voucher });
}

function filterProducts(state, params = {}) {
  const search = String(params.search || params.q || "").trim().toLowerCase();
  const categoryId = params.categoryId || "";
  const includeInactive = params.includeInactive === true || params.includeInactive === "true";
  return state.products
    .filter((product) => includeInactive || product.isActive)
    .filter((product) => {
      const category = state.categories.find((item) => item.id === product.categoryId);
      if (!includeInactive && category && !category.isActive) return false;
      if (categoryId && product.categoryId !== categoryId) return false;
      if (!search) return true;
      return `${product.name} ${product.description} ${category?.name || ""}`
        .toLowerCase()
        .includes(search);
    })
    .map((product) => withCategory(state, product));
}

function productFormPayload(payload) {
  return {
    categoryId: payload.categoryId,
    name: String(payload.name || "").trim(),
    description: String(payload.description || "").trim(),
    unitPrice: Number(payload.unitPrice || 0).toFixed(2),
    imageUrl: String(payload.imageUrl || "").trim(),
    isActive: Boolean(payload.isActive),
    quantity: Number(payload.quantity || 0),
  };
}

function calculateOrderTotal(items) {
  return items.reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0
  );
}

function normalizeVoucherCode(value) {
  return String(value || "").trim().toUpperCase();
}

function findActiveVoucher(state, voucherCode) {
  const code = normalizeVoucherCode(voucherCode);
  return (state.vouchers || []).find((voucher) => voucher.code === code && voucher.isActive);
}

function calculateDiscountAmount(subtotal, voucher) {
  return Number((subtotal * (Number(voucher.percentage || 0) / 100)).toFixed(2));
}

function quoteCartVoucher(state, userId, voucherCode) {
  const voucher = findActiveVoucher(state, voucherCode);
  if (!voucher) {
    error("Voucher code is invalid or inactive.", {
      status: 400,
      code: "BAD_REQUEST",
      fields: { voucherCode: "Enter an active voucher code." },
    });
  }

  const cart = state.carts.find((item) => item.userId === userId);
  if (!cart || cart.items.length === 0) {
    error("Cart is empty.", { status: 400, code: "EMPTY_CART" });
  }

  const subtotalAmount = cart.items.reduce((sum, cartItem) => {
    const product = state.products.find((item) => item.id === cartItem.productId);
    if (!product || !product.isActive || cartItem.quantity > product.quantity) {
      error("Stock is no longer available for this quantity.", {
        status: 409,
        code: "STOCK_CONFLICT",
      });
    }
    return sum + Number(product.unitPrice || 0) * Number(cartItem.quantity || 0);
  }, 0);
  const discountAmount = calculateDiscountAmount(subtotalAmount, voucher);

  return {
    voucher,
    subtotalAmount: subtotalAmount.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    totalAmount: (subtotalAmount - discountAmount).toFixed(2),
  };
}

const allowedOrderStatusTransitions = {
  pending: ["placed", "paid", "cancelled"],
  placed: ["paid", "cancelled"],
  paid: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

function validateOrderStatusTransition(order, nextStatus) {
  if (order.orderStatus === nextStatus) return;
  if ((allowedOrderStatusTransitions[order.orderStatus] || []).includes(nextStatus)) return;
  error(`Cannot change order status from ${order.orderStatus} to ${nextStatus}.`, {
    status: 409,
    code: "CONFLICT",
    fields: { orderStatus: "Choose a valid next status for this order." },
  });
}

export const mockApi = {
  async getCurrentUser() {
    await delay();
    const state = loadState();
    return publicUser(currentUser(state));
  },

  async login(credentials) {
    await delay();
    const state = loadState();
    const user = state.users.find(
      (item) => item.email.toLowerCase() === String(credentials.email || "").toLowerCase()
    );
    if (!user || user.password !== credentials.password) {
      error("Invalid email or password.", {
        status: 401,
        code: "INVALID_CREDENTIALS",
        fields: { email: "Invalid email or password." },
      });
    }
    state.sessionUserId = user.id;
    saveState(state);
    return publicUser(user);
  },

  async logout() {
    await delay();
    const state = loadState();
    state.sessionUserId = null;
    saveState(state);
    return { message: "Signed out." };
  },

  async register(payload) {
    await delay();
    const state = loadState();
    const email = String(payload.email || "").trim().toLowerCase();
    if (state.users.some((user) => user.email.toLowerCase() === email)) {
      error("Email is already registered.", {
        status: 409,
        code: "DUPLICATE_EMAIL",
        fields: { email: "Email is already registered." },
      });
    }
    const user = {
      id: makeId("user"),
      fullName: String(payload.fullName || "").trim(),
      phoneNumber: String(payload.phoneNumber || "").trim(),
      email,
      password: payload.password,
      role: "customer",
    };
    state.users.push(user);
    state.carts.push({ id: makeId("cart"), userId: user.id, items: [] });
    saveState(state);
    return publicUser(user);
  },

  async changePassword(payload) {
    await delay();
    const state = loadState();
    const user = requireUser(state);
    if (user.password !== payload.currentPassword) {
      error("Current password is incorrect.", {
        status: 400,
        code: "INVALID_CURRENT_PASSWORD",
        fields: { currentPassword: "Current password is incorrect." },
      });
    }
    user.password = payload.newPassword;
    saveState(state);
    return { message: "Password changed successfully." };
  },

  async listCategories(params = {}) {
    await delay();
    const state = loadState();
    const includeInactive = params.includeInactive === true || params.includeInactive === "true";
    const search = String(params.search || params.q || "").trim().toLowerCase();
    return state.categories
      .filter((category) => includeInactive || category.isActive)
      .filter((category) => {
        if (!search) return true;
        return `${category.name} ${category.description}`.toLowerCase().includes(search);
      })
      .map((category) => normalizeCategory(category));
  },

  async createCategory(payload) {
    await delay();
    const state = loadState();
    requireUser(state, "manager");
    const name = String(payload.name || "").trim();
    if (state.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      error("Category name already exists.", {
        status: 409,
        code: "DUPLICATE_CATEGORY",
        fields: { name: "Category name already exists." },
      });
    }
    const category = {
      id: makeId("cat"),
      name,
      description: String(payload.description || "").trim(),
      isActive: payload.isActive !== false,
    };
    state.categories.push(category);
    saveState(state);
    return normalizeCategory(category);
  },

  async updateCategory(id, payload) {
    await delay();
    const state = loadState();
    requireUser(state, "manager");
    const category = state.categories.find((item) => item.id === id);
    if (!category) error("Category not found.", { status: 404, code: "NOT_FOUND" });
    const name = String(payload.name || "").trim();
    if (
      state.categories.some(
        (item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      error("Category name already exists.", {
        status: 409,
        code: "DUPLICATE_CATEGORY",
        fields: { name: "Category name already exists." },
      });
    }
    category.name = name;
    category.description = String(payload.description || "").trim();
    category.isActive = Boolean(payload.isActive);
    saveState(state);
    return normalizeCategory(category);
  },

  async softDisableCategory(id) {
    await delay();
    const state = loadState();
    requireUser(state, "manager");
    const category = state.categories.find((item) => item.id === id);
    if (!category) error("Category not found.", { status: 404, code: "NOT_FOUND" });
    category.isActive = false;
    saveState(state);
    return normalizeCategory(category);
  },

  async listProducts(params = {}) {
    await delay();
    const state = loadState();
    if (params.includeInactive === true || params.includeInactive === "true") {
      requireUser(state, "manager");
    }
    return filterProducts(state, params);
  },

  async getProduct(id, options = {}) {
    await delay();
    const state = loadState();
    const product = state.products.find((item) => item.id === id);
    if (!product) error("Product not found.", { status: 404, code: "NOT_FOUND" });
    if (!options.includeInactive && !product.isActive) {
      error("Product is unavailable.", { status: 404, code: "NOT_FOUND" });
    }
    return withCategory(state, product);
  },

  async createProduct(payload) {
    await delay();
    const state = loadState();
    requireUser(state, "manager");
    if (!state.categories.some((category) => category.id === payload.categoryId)) {
      error("Category is required.", {
        status: 400,
        code: "VALIDATION_ERROR",
        fields: { categoryId: "Category is required." },
      });
    }
    const product = { id: makeId("product"), ...productFormPayload(payload) };
    state.products.push(product);
    saveState(state);
    return withCategory(state, product);
  },

  async updateProduct(id, payload) {
    await delay();
    const state = loadState();
    requireUser(state, "manager");
    const product = state.products.find((item) => item.id === id);
    if (!product) error("Product not found.", { status: 404, code: "NOT_FOUND" });
    Object.assign(product, productFormPayload(payload));
    saveState(state);
    return withCategory(state, product);
  },

  async updateStock(id, quantity) {
    await delay();
    const state = loadState();
    requireUser(state, "manager");
    const product = state.products.find((item) => item.id === id);
    if (!product) error("Product not found.", { status: 404, code: "NOT_FOUND" });
    product.quantity = Number(quantity);
    saveState(state);
    return withCategory(state, product);
  },

  async softDisableProduct(id) {
    await delay();
    const state = loadState();
    requireUser(state, "manager");
    const product = state.products.find((item) => item.id === id);
    if (!product) error("Product not found.", { status: 404, code: "NOT_FOUND" });
    product.isActive = false;
    saveState(state);
    return withCategory(state, product);
  },

  async getCart() {
    await delay();
    const state = loadState();
    const user = requireUser(state, "customer");
    return getCartForUser(state, user.id);
  },

  async addCartItem(payload) {
    await delay();
    const state = loadState();
    const user = requireUser(state, "customer");
    const product = state.products.find((item) => item.id === payload.productId);
    if (!product || !product.isActive) {
      error("Product is unavailable.", { status: 404, code: "NOT_FOUND" });
    }
    const quantity = Number(payload.quantity || 1);
    if (quantity < 1 || quantity > product.quantity) {
      error("Stock is no longer available for this quantity.", {
        status: 409,
        code: "STOCK_CONFLICT",
      });
    }
    let cart = state.carts.find((item) => item.userId === user.id);
    if (!cart) {
      cart = { id: makeId("cart"), userId: user.id, items: [] };
      state.carts.push(cart);
    }
    const existing = cart.items.find((item) => item.productId === product.id);
    const nextQuantity = Number(existing?.quantity || 0) + quantity;
    if (nextQuantity > product.quantity) {
      error("Stock is no longer available for this quantity.", {
        status: 409,
        code: "STOCK_CONFLICT",
      });
    }
    if (existing) {
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({ id: makeId("cart-item"), productId: product.id, quantity });
    }
    saveState(state);
    return getCartForUser(state, user.id);
  },

  async updateCartItem(itemId, payload) {
    await delay();
    const state = loadState();
    const user = requireUser(state, "customer");
    const cart = state.carts.find((item) => item.userId === user.id);
    const cartItem = cart?.items.find((item) => item.id === itemId);
    if (!cartItem) error("Cart item not found.", { status: 404, code: "NOT_FOUND" });
    const product = state.products.find((item) => item.id === cartItem.productId);
    const quantity = Number(payload.quantity);
    if (!product || quantity < 1 || quantity > product.quantity) {
      error("Stock is no longer available for this quantity.", {
        status: 409,
        code: "STOCK_CONFLICT",
      });
    }
    cartItem.quantity = quantity;
    saveState(state);
    return getCartForUser(state, user.id);
  },

  async removeCartItem(itemId) {
    await delay();
    const state = loadState();
    const user = requireUser(state, "customer");
    const cart = state.carts.find((item) => item.userId === user.id);
    if (cart) {
      cart.items = cart.items.filter((item) => item.id !== itemId);
    }
    saveState(state);
    return getCartForUser(state, user.id);
  },

  async clearCart() {
    await delay();
    const state = loadState();
    const user = requireUser(state, "customer");
    const cart = state.carts.find((item) => item.userId === user.id);
    if (cart) cart.items = [];
    saveState(state);
    return getCartForUser(state, user.id);
  },

  async applyVoucher(payload) {
    await delay();
    const state = loadState();
    const user = requireUser(state, "customer");
    return normalizeVoucherQuote(quoteCartVoucher(state, user.id, payload.voucherCode));
  },

  async createOrder(payload) {
    await delay();
    const state = loadState();
    const user = requireUser(state, "customer");
    const cart = state.carts.find((item) => item.userId === user.id);
    if (!cart || cart.items.length === 0) {
      error("Cart is empty.", { status: 400, code: "EMPTY_CART" });
    }
    const fields = {};
    if (!String(payload.recipientName || "").trim()) fields.recipientName = "Recipient name is required.";
    if (!String(payload.recipientPhone || "").trim()) fields.recipientPhone = "Recipient phone is required.";
    if (!String(payload.shippingAddress?.state || "").trim()) fields.state = "State is required.";
    if (!String(payload.shippingAddress?.city || "").trim()) fields.city = "City is required.";
    if (!String(payload.shippingAddress?.street || "").trim()) fields.street = "Street is required.";
    if (!String(payload.shippingAddress?.buildingNumber || "").trim()) {
      fields.buildingNumber = "Building number is required.";
    }
    if (Object.keys(fields).length) {
      error("Invalid order data.", { status: 400, code: "VALIDATION_ERROR", fields });
    }
    const orderItems = cart.items.map((cartItem) => {
      const product = state.products.find((item) => item.id === cartItem.productId);
      if (!product || !product.isActive || cartItem.quantity > product.quantity) {
        error("Stock is no longer available for this quantity.", {
          status: 409,
          code: "STOCK_CONFLICT",
        });
      }
      return {
        id: makeId("order-item"),
        productId: product.id,
        productName: product.name,
        quantity: cartItem.quantity,
        unitPrice: product.unitPrice,
        lineTotal: (Number(product.unitPrice) * cartItem.quantity).toFixed(2),
      };
    });
    const subtotalAmount = calculateOrderTotal(orderItems);
    let voucher = null;
    let discountAmount = 0;
    if (payload.voucherCode) {
      const quote = quoteCartVoucher(state, user.id, payload.voucherCode);
      voucher = quote.voucher;
      discountAmount = Number(quote.discountAmount);
    }
    orderItems.forEach((item) => {
      const product = state.products.find((entry) => entry.id === item.productId);
      product.quantity = Math.max(0, product.quantity - item.quantity);
    });
    const totalAmount = (subtotalAmount - discountAmount).toFixed(2);
    const order = {
      id: makeId("order"),
      customerId: user.id,
      recipientName: String(payload.recipientName || "").trim(),
      recipientPhone: String(payload.recipientPhone || "").trim(),
      shippingAddress: {
        state: String(payload.shippingAddress.state || "").trim(),
        city: String(payload.shippingAddress.city || "").trim(),
        street: String(payload.shippingAddress.street || "").trim(),
        buildingNumber: String(payload.shippingAddress.buildingNumber || "").trim(),
      },
      voucher,
      giftMessage: String(payload.giftMessage || "").trim(),
      orderStatus: "pending",
      paymentMethod: payload.paymentMethod,
      subtotalAmount: subtotalAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAmount,
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.orders.unshift(order);
    cart.items = [];
    saveState(state);
    return normalizeOrderWithRelations(state, order);
  },

  async listOrders(params = {}) {
    await delay();
    const state = loadState();
    const user = requireUser(state);
    const managerScope = params.scope === "all" || params.scope === "manager";
    if (managerScope) requireUser(state, "manager");
    const status = params.status || "";
    const query = String(params.query || "").trim().toLowerCase();
    return state.orders
      .filter((order) => (managerScope ? true : order.customerId === user.id))
      .filter((order) => (!status ? true : order.orderStatus === status))
      .filter((order) => {
        if (!query) return true;
        const customer = state.users.find((entry) => entry.id === order.customerId);
        return `${order.id} ${order.recipientName || ""} ${order.recipientPhone || ""} ${customer?.fullName || ""} ${customer?.email || ""}`
          .toLowerCase()
          .includes(query);
      })
      .map((order) => normalizeOrderWithRelations(state, order));
  },

  async getOrder(id, params = {}) {
    await delay();
    const state = loadState();
    const user = requireUser(state);
    const order = state.orders.find((item) => item.id === id);
    if (!order) error("Order not found.", { status: 404, code: "NOT_FOUND" });
    const managerScope = params.scope === "manager";
    if (managerScope) {
      requireUser(state, "manager");
    } else if (user.role !== "customer" || order.customerId !== user.id) {
      error("This account cannot access that order.", { status: 403, code: "FORBIDDEN" });
    }
    return normalizeOrderWithRelations(state, order);
  },

  async updateOrderStatus(id, orderStatus) {
    await delay();
    const state = loadState();
    requireUser(state, "manager");
    const order = state.orders.find((item) => item.id === id);
    if (!order) error("Order not found.", { status: 404, code: "NOT_FOUND" });
    validateOrderStatusTransition(order, orderStatus);
    order.orderStatus = orderStatus;
    order.updatedAt = new Date().toISOString();
    saveState(state);
    return normalizeOrderWithRelations(state, order);
  },

  async placeOrder(orderId) {
    await delay();
    const state = loadState();
    const user = requireUser(state, "customer");
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || order.customerId !== user.id) {
      error("Order not found.", { status: 404, code: "NOT_FOUND" });
    }
    if (order.orderStatus !== "pending") {
      error("This order is not eligible for payment.", {
        status: 409,
        code: "PAYMENT_NOT_ALLOWED",
      });
    }
    const payment = {
      id: makeId("payment"),
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      paymentDate: new Date().toISOString(),
      amount: Number(order.totalAmount).toFixed(2),
      status: "completed",
    };
    state.payments.push(payment);
    order.orderStatus = "placed";
    order.updatedAt = new Date().toISOString();
    saveState(state);
    return normalizeOrderWithRelations(state, order);
  },

  async getOrderPayments(orderId, params = {}) {
    await delay();
    const state = loadState();
    const user = requireUser(state);
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) error("Order not found.", { status: 404, code: "NOT_FOUND" });
    if (params.scope === "manager") {
      requireUser(state, "manager");
    } else if (order.customerId !== user.id) {
      error("This account cannot access those payments.", { status: 403, code: "FORBIDDEN" });
    }
    return state.payments
      .filter((payment) => payment.orderId === orderId)
      .map((payment) => normalizePayment(payment));
  },

  async getRevenueSummary() {
    await delay();
    const state = loadState();
    requireUser(state, "manager");
    const countedStatuses = ["paid", "completed"];
    const countedOrders = state.orders.filter((order) => countedStatuses.includes(order.orderStatus));
    const paidRevenue = countedOrders
      .filter((order) => order.orderStatus === "paid")
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const completedRevenue = countedOrders
      .filter((order) => order.orderStatus === "completed")
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const excluded = {
      pending: state.orders.filter((order) => order.orderStatus === "pending").length,
      placed: state.orders.filter((order) => order.orderStatus === "placed").length,
      cancelled: state.orders.filter((order) => order.orderStatus === "cancelled").length,
    };
    return normalizeRevenue({
      totalRevenue: paidRevenue + completedRevenue,
      countedOrderCount: countedOrders.length,
      paidRevenue,
      completedRevenue,
      excluded,
      countedOrders: countedOrders.map((order) => normalizeOrderWithRelations(state, order)),
    });
  },

  reset() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createInitialMockState()));
  },

  snapshot() {
    return clone(loadState());
  },
};
