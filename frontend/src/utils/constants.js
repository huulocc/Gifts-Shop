export const roles = {
  customer: "customer",
  manager: "manager",
};

export const orderStatuses = ["pending", "placed", "paid", "cancelled", "completed"];

export const paymentMethods = ["cash", "credit_card", "paypal", "bank_transfer"];

export const paymentStatuses = ["pending", "completed", "failed", "refunded"];

export const statusLabels = {
  pending: "Pending",
  placed: "Placed",
  paid: "Paid",
  cancelled: "Cancelled",
  completed: "Completed",
  cash: "Cash",
  credit_card: "Credit card",
  paypal: "PayPal",
  bank_transfer: "Bank transfer",
  failed: "Failed",
  refunded: "Refunded",
  active: "Active",
  inactive: "Inactive",
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

export const roleLandingPath = {
  customer: "/products",
  manager: "/manager",
};

export const productFallbackImage =
  "https://picsum.photos/seed/giftshop-wrapped-gift/1200/900";
