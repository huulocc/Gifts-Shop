function toUiEnum(value) {
  if (value === null || value === undefined) return value;
  return String(value).trim().toLowerCase();
}

function normalizeMoney(value) {
  if (value === null || value === undefined || value === "") return "0.00";
  return Number(value).toFixed(2);
}

export function normalizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName || "",
    phoneNumber: user.phoneNumber || "",
    email: user.email || "",
    role: toUiEnum(user.role),
  };
}

export function normalizeCategory(category) {
  if (!category) return null;
  return {
    id: category.id,
    name: category.name || "",
    description: category.description || "",
    isActive: Boolean(category.isActive),
  };
}

export function normalizeProduct(product) {
  if (!product) return null;
  const category = product.category ? normalizeCategory(product.category) : null;
  return {
    id: product.id,
    categoryId: product.categoryId || category?.id || "",
    category,
    name: product.name || "",
    description: product.description || "",
    unitPrice: normalizeMoney(product.unitPrice),
    imageUrl: product.imageUrl || "",
    isActive: Boolean(product.isActive),
    quantity: Number(product.quantity || 0),
  };
}

export function normalizeCart(cart) {
  if (!cart) {
    return { id: "", items: [], subtotal: "0.00", total: "0.00" };
  }
  const items = Array.isArray(cart.items) ? cart.items : [];
  const normalizedItems = items.map((item) => ({
    id: item.id,
    product: normalizeProduct(item.product),
    quantity: Number(item.quantity || 0),
    lineTotal: normalizeMoney(
      item.lineTotal ||
        Number(item.product?.unitPrice || 0) * Number(item.quantity || 0)
    ),
  }));
  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + Number(item.lineTotal || 0),
    0
  );
  return {
    id: cart.id || "",
    items: normalizedItems,
    subtotal: normalizeMoney(cart.subtotal || subtotal),
    total: normalizeMoney(cart.total || subtotal),
  };
}

export function normalizeAddress(address) {
  if (!address) return null;
  return {
    state: address.state || "",
    city: address.city || "",
    street: address.street || "",
    buildingNumber: address.buildingNumber || "",
  };
}

export function normalizeVoucher(voucher) {
  if (!voucher) return null;
  return {
    id: voucher.id || "",
    code: String(voucher.code || "").trim().toUpperCase(),
    percentage: normalizeMoney(voucher.percentage),
  };
}

export function normalizeVoucherQuote(quote) {
  if (!quote) return null;
  return {
    voucher: normalizeVoucher(quote.voucher),
    subtotalAmount: normalizeMoney(quote.subtotalAmount),
    discountAmount: normalizeMoney(quote.discountAmount),
    totalAmount: normalizeMoney(quote.totalAmount),
  };
}

export function normalizeOrder(order) {
  if (!order) return null;
  const items = Array.isArray(order.items) ? order.items : [];
  const normalizedItems = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName || item.product?.name || "Product",
    quantity: Number(item.quantity || 0),
    unitPrice: normalizeMoney(item.unitPrice),
    lineTotal: normalizeMoney(
      item.lineTotal || Number(item.unitPrice || 0) * Number(item.quantity || 0)
    ),
  }));
  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + Number(item.lineTotal || 0),
    0
  );
  return {
    id: order.id,
    customer: normalizeUser(order.customer),
    recipientName: order.recipientName || "",
    recipientPhone: order.recipientPhone || "",
    shippingAddress: normalizeAddress(order.shippingAddress || order.address),
    voucher: normalizeVoucher(order.voucher),
    giftMessage: order.giftMessage || "",
    orderStatus: toUiEnum(order.orderStatus),
    paymentMethod: toUiEnum(order.paymentMethod),
    subtotalAmount: normalizeMoney(order.subtotalAmount || subtotal),
    discountAmount: normalizeMoney(order.discountAmount),
    totalAmount: normalizeMoney(order.totalAmount),
    items: normalizedItems,
    payments: Array.isArray(order.payments)
      ? order.payments.map((payment) => normalizePayment(payment))
      : [],
    createdAt: order.createdAt || "",
    updatedAt: order.updatedAt || "",
  };
}

export function normalizePayment(payment) {
  if (!payment) return null;
  return {
    id: payment.id,
    orderId: payment.orderId,
    paymentMethod: toUiEnum(payment.paymentMethod),
    paymentDate: payment.paymentDate || payment.createdAt || "",
    amount: normalizeMoney(payment.amount),
    status: toUiEnum(payment.status),
  };
}

export function normalizeRevenue(summary) {
  const excluded = summary?.excluded || {};
  return {
    totalRevenue: normalizeMoney(summary?.totalRevenue),
    countedOrderCount: Number(summary?.countedOrderCount || 0),
    paidRevenue: normalizeMoney(summary?.paidRevenue),
    completedRevenue: normalizeMoney(summary?.completedRevenue),
    excluded: {
      pending: Number(excluded.pending || 0),
      placed: Number(excluded.placed || 0),
      cancelled: Number(excluded.cancelled || 0),
    },
    countedOrders: Array.isArray(summary?.countedOrders)
      ? summary.countedOrders.map((order) => normalizeOrder(order))
      : [],
  };
}

export function normalizeApiError(error) {
  if (error?.error) {
    return {
      code: error.error.code || "REQUEST_FAILED",
      message: error.error.message || "Request failed.",
      fields: error.error.fields || {},
      status: error.status || 500,
    };
  }
  return {
    code: error?.code || "REQUEST_FAILED",
    message: error?.message || "Request failed.",
    fields: error?.fields || {},
    status: error?.status || 500,
  };
}
